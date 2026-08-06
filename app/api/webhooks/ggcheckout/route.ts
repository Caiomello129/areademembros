import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccessEmail } from "@/lib/email/send-access-email";

type GGCheckoutProduct = {
  id?: string;
  type?: "main" | "orderbump" | "upsell" | "downsell" | string;
  title?: string;
  price?: number;
};

type GGCheckoutPayload = {
  event?: string;
  createdAt?:
    | string
    | {
        _seconds?: number;
        _nanoseconds?: number;
      };

  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
  };

  payment?: {
    id?: string;
    method?: string;
    paymentMethod?: string;
    status?: string;
    amount?: number;
  };

  product?: GGCheckoutProduct;
  products?: GGCheckoutProduct[];
};

function getReceivedSecret(request: Request) {
  const authorization = request.headers.get("authorization");
  const xSecret = request.headers.get("x-secret");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  return xSecret?.trim() ?? "";
}

function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase() ?? "";
}

function normalizePaymentMethod(method?: string) {
  const value = method?.toLowerCase() ?? "";

  if (value.includes("pix")) return "pix";

  if (
    value.includes("card") ||
    value.includes("credit")
  ) {
    return "card";
  }

  if (value.includes("boleto")) return "boleto";

  return "other";
}

function normalizeItemType(type?: string) {
  const acceptedTypes = [
    "main",
    "orderbump",
    "upsell",
    "downsell",
  ];

  return acceptedTypes.includes(type ?? "")
    ? type
    : "other";
}

function getPayloadProducts(
  payload: GGCheckoutPayload
) {
  if (
    payload.products &&
    payload.products.length > 0
  ) {
    return payload.products;
  }

  if (payload.product) {
    return [payload.product];
  }

  return [];
}

function convertAmountToCents(amount?: number) {
  if (!amount || amount < 0) {
    return 0;
  }

  return Math.round(amount * 100);
}

function normalizeCreatedAt(
  createdAt?: GGCheckoutPayload["createdAt"]
) {
  if (!createdAt) {
    return new Date().toISOString();
  }

  if (typeof createdAt === "string") {
    const parsedDate = new Date(createdAt);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }

    return new Date().toISOString();
  }

  if (
    typeof createdAt === "object" &&
    typeof createdAt._seconds === "number"
  ) {
    const milliseconds =
      createdAt._seconds * 1000 +
      Math.floor(
        (createdAt._nanoseconds ?? 0) / 1_000_000
      );

    return new Date(milliseconds).toISOString();
  }

  return new Date().toISOString();
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "ggcheckout-webhook",
  });
}

export async function POST(request: Request) {
  const configuredSecret =
    process.env.GG_CHECKOUT_WEBHOOK_SECRET;

  if (!configuredSecret) {
    return NextResponse.json(
      {
        error:
          "Webhook não configurado no servidor.",
      },
      {
        status: 500,
      }
    );
  }

  const receivedSecret =
    getReceivedSecret(request);

  if (
    !receivedSecret ||
    receivedSecret !== configuredSecret
  ) {
    return NextResponse.json(
      {
        error: "Webhook não autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  let payload: GGCheckoutPayload;

  try {
    payload =
      (await request.json()) as GGCheckoutPayload;
  } catch {
    /*
     * Algumas plataformas enviam uma requisição
     * de validação sem JSON completo ao cadastrar
     * o webhook.
     */
    return NextResponse.json(
      {
        received: true,
        validation: true,
        message: "Endpoint disponível.",
      },
      {
        status: 200,
      }
    );
  }

  const eventType = payload.event;
  const paymentId = payload.payment?.id;

  const customerEmail = normalizeEmail(
    payload.customer?.email
  );

  /*
   * A GG Checkout pode enviar um POST de validação
   * sem os dados completos de uma compra.
   *
   * Nesse caso, respondemos 200 para permitir
   * que o webhook seja cadastrado.
   *
   * Nenhum usuário, compra ou acesso é criado aqui.
   */
  if (!eventType || !paymentId) {
    console.log(
      "Validação do webhook GG Checkout recebida:",
      payload
    );

    return NextResponse.json(
      {
        received: true,
        validation: true,
        message: "Endpoint disponível.",
      },
      {
        status: 200,
      }
    );
  }

  const externalEventId =
    `${eventType}:${paymentId}`;

  const admin = createAdminClient();

  const { data: existingEvent } = await admin
    .from("webhook_events")
    .select("id, status, attempts")
    .eq("provider", "ggcheckout")
    .eq("external_event_id", externalEventId)
    .maybeSingle();

  if (
    existingEvent?.status === "processed"
  ) {
    return NextResponse.json({
      received: true,
      processed: true,
      duplicate: true,
      eventId: existingEvent.id,
    });
  }

  let webhookEventId: string;

  if (existingEvent) {
    webhookEventId = existingEvent.id;

    await admin
      .from("webhook_events")
      .update({
        status: "processing",
        attempts:
          (existingEvent.attempts ?? 0) + 1,
        error_message: null,
      })
      .eq("id", existingEvent.id);
  } else {
    const {
      data: createdEvent,
      error: eventError,
    } = await admin
      .from("webhook_events")
      .insert({
        provider: "ggcheckout",
        external_event_id: externalEventId,
        event_type: eventType,
        external_payment_id: paymentId,
        payload,
        status: "processing",
        attempts: 1,
      })
      .select("id")
      .single();

    if (eventError || !createdEvent) {
      if (eventError?.code === "23505") {
        return NextResponse.json({
          received: true,
          duplicate: true,
        });
      }

      return NextResponse.json(
        {
          error:
            "Não foi possível registrar o webhook.",
          details: eventError?.message,
        },
        {
          status: 500,
        }
      );
    }

    webhookEventId = createdEvent.id;
  }

  try {
    const paidEvents = [
      "pix.paid",
      "card.paid",
    ];

    const refundedEvents = [
      "pix.refunded",
      "card.refunded",
    ];

    /*
     * Eventos que não são pagamento aprovado
     * nem reembolso são registrados e ignorados.
     */
    if (
      !paidEvents.includes(eventType) &&
      !refundedEvents.includes(eventType)
    ) {
      await admin
        .from("webhook_events")
        .update({
          status: "ignored",
          processed_at:
            new Date().toISOString(),
        })
        .eq("id", webhookEventId);

      return NextResponse.json({
        received: true,
        processed: false,
        ignored: true,
        eventId: webhookEventId,
      });
    }

    /*
     * Processamento de reembolso.
     */
    if (
      refundedEvents.includes(eventType)
    ) {
      const {
        data: purchase,
        error: purchaseError,
      } = await admin
        .from("purchases")
        .select("id")
        .eq("provider", "ggcheckout")
        .eq(
          "external_payment_id",
          paymentId
        )
        .maybeSingle();

      if (purchaseError) {
        throw new Error(
          purchaseError.message
        );
      }

      if (purchase) {
        const now =
          new Date().toISOString();

        const {
          error: refundPurchaseError,
        } = await admin
          .from("purchases")
          .update({
            status: "refunded",
            refunded_at: now,
            raw_payload: payload,
          })
          .eq("id", purchase.id);

        if (refundPurchaseError) {
          throw new Error(
            refundPurchaseError.message
          );
        }

        const {
          error: revokeAccessError,
        } = await admin
          .from("user_product_access")
          .update({
            status: "revoked",
            revoked_at: now,
          })
          .eq("purchase_id", purchase.id)
          .eq("status", "active");

        if (revokeAccessError) {
          throw new Error(
            revokeAccessError.message
          );
        }
      }

      await admin
        .from("webhook_events")
        .update({
          status: "processed",
          processed_at:
            new Date().toISOString(),
          error_message: null,
        })
        .eq("id", webhookEventId);

      return NextResponse.json({
        received: true,
        processed: true,
        refunded: true,
        eventId: webhookEventId,
      });
    }

    /*
     * Processamento de pagamento aprovado.
     */
    if (!customerEmail) {
      throw new Error(
        "O cliente não possui e-mail no payload."
      );
    }

    const payloadProducts =
      getPayloadProducts(payload);

    if (payloadProducts.length === 0) {
      throw new Error(
        "Nenhum produto foi enviado no payload."
      );
    }

    /*
     * Procura o perfil pelo e-mail.
     */
    let {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", customerEmail)
      .maybeSingle();

    if (profileError) {
      throw new Error(
        profileError.message
      );
    }

    /*
     * Se o usuário ainda não existir,
     * cria no Supabase Auth.
     */
    if (!profile) {
      const temporaryPassword =
        randomBytes(24).toString("hex") +
        "A1!";

      const {
        data: createdUser,
        error: createUserError,
      } =
        await admin.auth.admin.createUser({
          email: customerEmail,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name:
              payload.customer?.name ?? null,
            phone:
              payload.customer?.phone ?? null,
          },
        });

      if (
        createUserError ||
        !createdUser.user
      ) {
        throw new Error(
          createUserError?.message ??
            "Não foi possível criar o usuário."
        );
      }

      const {
        data: createdProfile,
        error: createdProfileError,
      } = await admin
        .from("profiles")
        .upsert({
          id: createdUser.user.id,
          email: customerEmail,
          full_name:
            payload.customer?.name ?? null,
          phone:
            payload.customer?.phone ?? null,
          role: "customer",
        })
        .select("id, email")
        .single();

      if (
        createdProfileError ||
        !createdProfile
      ) {
        throw new Error(
          createdProfileError?.message ??
            "Não foi possível criar o perfil."
        );
      }

      profile = createdProfile;
    }

    /*
     * Cria ou atualiza a compra.
     */
    const {
      data: purchase,
      error: purchaseError,
    } = await admin
      .from("purchases")
      .upsert(
        {
          user_id: profile.id,
          provider: "ggcheckout",
          external_payment_id:
            paymentId,
          customer_email:
            customerEmail,
          customer_name:
            payload.customer?.name ?? null,
          customer_phone:
            payload.customer?.phone ?? null,
          payment_method:
            normalizePaymentMethod(
              payload.payment
                ?.paymentMethod ??
                payload.payment?.method
            ),
          amount_cents:
            convertAmountToCents(
              payload.payment?.amount
            ),
          status: "paid",
          paid_at: normalizeCreatedAt(
            payload.createdAt
          ),
          raw_payload: payload,
        },
        {
          onConflict:
            "provider,external_payment_id",
        }
      )
      .select("id")
      .single();

    if (
      purchaseError ||
      !purchase
    ) {
      throw new Error(
        purchaseError?.message ??
          "Não foi possível registrar a compra."
      );
    }

    const releasedProducts: string[] = [];

    /*
     * Processa produto principal, order bump,
     * upsell e downsell.
     */
    for (
      const payloadProduct of payloadProducts
    ) {
      if (!payloadProduct.id) {
        throw new Error(
          "Um dos produtos não possui ID na GG Checkout."
        );
      }

      const {
        data: internalProduct,
        error: productError,
      } = await admin
        .from("products")
        .select(
          "id, title, ggcheckout_product_id"
        )
        .eq(
          "ggcheckout_product_id",
          payloadProduct.id
        )
        .eq("status", "active")
        .maybeSingle();

      if (productError) {
        throw new Error(
          productError.message
        );
      }

      if (!internalProduct) {
        throw new Error(
          `Produto da GG Checkout não vinculado: ${payloadProduct.id}`
        );
      }

      /*
       * Registra o item da compra.
       */
      const {
        data: purchaseItem,
        error: itemError,
      } = await admin
        .from("purchase_items")
        .upsert(
          {
            purchase_id: purchase.id,
            product_id:
              internalProduct.id,
            external_product_id:
              payloadProduct.id,
            title:
              payloadProduct.title ??
              internalProduct.title,
            item_type:
              normalizeItemType(
                payloadProduct.type
              ),
            price_cents:
              payloadProduct.price !==
              undefined
                ? Math.round(
                    payloadProduct.price
                  )
                : null,
          },
          {
            onConflict:
              "purchase_id,external_product_id",
          }
        )
        .select("id")
        .single();

      if (
        itemError ||
        !purchaseItem
      ) {
        throw new Error(
          itemError?.message ??
            "Não foi possível registrar o item da compra."
        );
      }

      /*
       * Libera o produto para o usuário.
       */
      const {
        error: accessError,
      } = await admin
        .from("user_product_access")
        .upsert(
          {
            user_id: profile.id,
            product_id:
              internalProduct.id,
            purchase_id: purchase.id,
            purchase_item_id:
              purchaseItem.id,
            status: "active",
            granted_at:
              new Date().toISOString(),
            revoked_at: null,
          },
          {
            onConflict:
              "purchase_item_id",
          }
        );

      if (accessError) {
        throw new Error(
          accessError.message
        );
      }

      releasedProducts.push(
        internalProduct.title
      );
    }

    /*
     * Envia o e-mail de acesso.
     * Caso o envio falhe, a compra continua
     * processada e o acesso permanece liberado.
     */
    let emailSent = false;

    let emailErrorMessage:
      | string
      | null = null;

    try {
      await sendAccessEmail({
        email: customerEmail,
        customerName:
          payload.customer?.name ?? null,
        productNames:
          releasedProducts,
      });

      emailSent = true;
    } catch (emailError) {
      emailErrorMessage =
        emailError instanceof Error
          ? emailError.message
          : "Erro desconhecido ao enviar o e-mail.";

      console.error(
        "Compra processada, mas o e-mail de acesso falhou:",
        emailErrorMessage
      );
    }

    await admin
      .from("webhook_events")
      .update({
        status: "processed",
        processed_at:
          new Date().toISOString(),
        error_message:
          emailErrorMessage,
      })
      .eq("id", webhookEventId);

    return NextResponse.json({
      received: true,
      processed: true,
      duplicate: false,
      eventId: webhookEventId,
      customerEmail,
      releasedProducts,
      emailSent,
      emailError:
        emailErrorMessage,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido";

    console.error(
      "Erro ao processar webhook:",
      message
    );

    await admin
      .from("webhook_events")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", webhookEventId);

    return NextResponse.json(
      {
        received: true,
        processed: false,
        error:
          "O webhook foi recebido, mas não foi processado.",
        details: message,
        eventId: webhookEventId,
      },
      {
        status: 500,
      }
    );
  }
}

