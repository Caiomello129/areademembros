import "server-only";

import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

type SendAccessEmailParams = {
  email: string;
  customerName?: string | null;
  productNames: string[];
};

export async function sendAccessEmail({
  email,
  customerName,
  productNames,
}: SendAccessEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.APP_URL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL não configurado.");
  }

  if (!appUrl) {
    throw new Error("APP_URL não configurada.");
  }

  const resend = new Resend(apiKey);
  const admin = createAdminClient();

  const { data, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo:
            `${appUrl}/auth/callback?next=/definir-senha`,
      },
    });

  if (linkError || !data?.properties?.action_link) {
    throw new Error(
      linkError?.message ??
        "Não foi possível gerar o link de acesso."
    );
  }

  const accessLink = data.properties.action_link;
  const firstName =
    customerName?.trim().split(" ")[0] || "Olá";

  const productsHtml = productNames
    .map(
      (product) =>
        `<li style="margin-bottom:8px;">${escapeHtml(product)}</li>`
    )
    .join("");

  const { data: emailData, error: emailError } =
    await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Seu acesso à área de membros foi liberado",
      html: `
        <!doctype html>
        <html lang="pt-BR">
          <body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#171717;">
            <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
              <div style="background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e5e5e5;">
                <h1 style="margin:0;font-size:26px;">
                  ${escapeHtml(firstName)}, seu acesso está liberado!
                </h1>

                <p style="margin:18px 0 0;line-height:1.6;color:#525252;">
                  Seu pagamento foi confirmado e os produtos abaixo já estão disponíveis na nossa área de membros:
                </p>

                <ul style="margin:20px 0;padding-left:22px;line-height:1.5;">
                  ${productsHtml}
                </ul>

                <p style="margin:20px 0;line-height:1.6;color:#525252;">
                  Clique no botão abaixo para criar sua senha e acessar seus materiais.
                </p>

                <a
                  href="${accessLink}"
                  style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:10px;"
                >
                  Criar senha e acessar
                </a>

                <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#737373;">
                  Caso o botão não funcione, copie e cole este endereço no navegador:
                </p>

                <p style="font-size:12px;line-height:1.5;word-break:break-all;color:#737373;">
                  ${accessLink}
                </p>

                <p style="margin:28px 0 0;font-size:13px;color:#737373;">
                  Modus Members
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

  if (emailError) {
    throw new Error(emailError.message);
  }

  return {
    emailId: emailData?.id,
    accessLink,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}