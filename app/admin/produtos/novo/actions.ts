"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getText(
  formData: FormData,
  field: string
) {
  return String(formData.get(field) ?? "").trim();
}

function priceToCents(value: string) {
  if (!value) {
    return null;
  }

  const normalized = value
    .replace(/\./g, "")
    .replace(",", ".");

  const price = Number(normalized);

  if (Number.isNaN(price) || price < 0) {
    return null;
  }

  return Math.round(price * 100);
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type CreateProductState = {
  error?: string;
};

export async function createProduct(
  _previousState: CreateProductState,
  formData: FormData
): Promise<CreateProductState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Sua sessão expirou. Entre novamente.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      error:
        "Você não possui permissão para cadastrar produtos.",
    };
  }

  const title = getText(formData, "title");
  const customSlug = getText(formData, "slug");
  const slug = createSlug(customSlug || title);
  const description = getText(
    formData,
    "description"
  );
  const thumbnailUrl = getText(
    formData,
    "thumbnail_url"
  );
  const ggcheckoutProductId = getText(
    formData,
    "ggcheckout_product_id"
  );
  const storeBadge = getText(
    formData,
    "store_badge"
  );
  const storeButtonText =
    getText(formData, "store_button_text") ||
    "Liberar produto";
  const storeLinkType =
    getText(formData, "store_link_type") ||
    "checkout";
  const storeUrl = getText(
    formData,
    "store_url"
  );

  const storePriceCents = priceToCents(
    getText(formData, "store_price")
  );

  const storeComparePriceCents =
    priceToCents(
      getText(formData, "store_compare_price")
    );

  const positionValue = Number(
    getText(formData, "position") || "0"
  );

  const storeEnabled =
    formData.get("store_enabled") === "on";

  if (!title) {
    return {
      error: "Informe o nome do produto.",
    };
  }

  if (!slug) {
    return {
      error:
        "Não foi possível gerar o endereço do produto.",
    };
  }

  if (!ggcheckoutProductId) {
    return {
      error:
        "Informe o ID do produto na GG Checkout.",
    };
  }

  if (
    ![
      "checkout",
      "sales_page",
      "external",
    ].includes(storeLinkType)
  ) {
    return {
      error: "Tipo de link inválido.",
    };
  }

  const { data: existingProduct } =
    await supabase
      .from("products")
      .select("id")
      .or(
        `slug.eq.${slug},ggcheckout_product_id.eq.${ggcheckoutProductId}`
      )
      .limit(1)
      .maybeSingle();

  if (existingProduct) {
    return {
      error:
        "Já existe um produto com esse slug ou ID da GG Checkout.",
    };
  }

  const { error } = await supabase
    .from("products")
    .insert({
      title,
      slug,
      description: description || null,
      thumbnail_url: thumbnailUrl || null,
      ggcheckout_product_id:
        ggcheckoutProductId,
      status: "active",
      featured: false,
      position: Number.isFinite(positionValue)
        ? positionValue
        : 0,
      store_enabled: storeEnabled,
      store_price_cents:
        storePriceCents,
      store_compare_price_cents:
        storeComparePriceCents,
      store_badge: storeBadge || null,
      store_button_text:
        storeButtonText,
      store_link_type:
        storeLinkType,
      store_url: storeUrl || null,
    });

  if (error) {
    console.error(
      "Erro ao cadastrar produto:",
      error
    );

    return {
      error:
        error.message ||
        "Não foi possível cadastrar o produto.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
  revalidatePath("/dashboard");
  revalidatePath("/loja");

  redirect("/admin/produtos");
}