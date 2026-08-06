"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ModuleActionState = {
  error?: string;
  success?: string;
};

function getText(
  formData: FormData,
  field: string
) {
  return String(
    formData.get(field) ?? ""
  ).trim();
}

async function getAdminClient() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      authorized: false,
      error: "Sua sessão expirou.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      supabase,
      authorized: false,
      error:
        "Você não possui permissão de administrador.",
    };
  }

  return {
    supabase,
    authorized: true,
    error: null,
  };
}

export async function createModule(
  _previousState: ModuleActionState,
  formData: FormData
): Promise<ModuleActionState> {
  const {
    supabase,
    authorized,
    error: authError,
  } = await getAdminClient();

  if (!authorized) {
    return {
      error:
        authError ??
        "Você não possui permissão.",
    };
  }

  const productId = getText(
    formData,
    "product_id"
  );

  const title = getText(
    formData,
    "title"
  );

  const description = getText(
    formData,
    "description"
  );

  const positionValue = Number(
    getText(formData, "position") || "0"
  );

  if (!productId) {
    return {
      error:
        "O produto não foi identificado.",
    };
  }

  if (!title) {
    return {
      error:
        "Informe o nome do módulo.",
    };
  }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (!product) {
    return {
      error:
        "O produto informado não existe.",
    };
  }

  const { error } = await supabase
    .from("product_modules")
    .insert({
      product_id: productId,
      title,
      description:
        description || null,
      position: Number.isFinite(
        positionValue
      )
        ? positionValue
        : 0,
      status: "active",
    });

  if (error) {
    console.error(
      "Erro ao criar módulo:",
      error
    );

    return {
      error:
        error.message ||
        "Não foi possível criar o módulo.",
    };
  }

  revalidatePath(
    `/admin/produtos/${productId}/conteudos`
  );

  revalidatePath(
    `/produtos`
  );

  return {
    success:
      "Módulo criado com sucesso.",
  };
}

export async function updateModule(
  formData: FormData
) {
  const {
    supabase,
    authorized,
  } = await getAdminClient();

  if (!authorized) {
    return;
  }

  const moduleId = getText(
    formData,
    "module_id"
  );

  const productId = getText(
    formData,
    "product_id"
  );

  const title = getText(
    formData,
    "title"
  );

  const description = getText(
    formData,
    "description"
  );

  const positionValue = Number(
    getText(formData, "position") || "0"
  );

  const status =
    getText(formData, "status") ===
    "inactive"
      ? "inactive"
      : "active";

  if (
    !moduleId ||
    !productId ||
    !title
  ) {
    return;
  }

  const { error } = await supabase
    .from("product_modules")
    .update({
      title,
      description:
        description || null,
      position: Number.isFinite(
        positionValue
      )
        ? positionValue
        : 0,
      status,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", moduleId)
    .eq("product_id", productId);

  if (error) {
    console.error(
      "Erro ao atualizar módulo:",
      error
    );

    return;
  }

  revalidatePath(
    `/admin/produtos/${productId}/conteudos`
  );
}

export async function toggleModuleStatus(
  formData: FormData
) {
  const {
    supabase,
    authorized,
  } = await getAdminClient();

  if (!authorized) {
    return;
  }

  const moduleId = getText(
    formData,
    "module_id"
  );

  const productId = getText(
    formData,
    "product_id"
  );

  const currentStatus = getText(
    formData,
    "current_status"
  );

  if (!moduleId || !productId) {
    return;
  }

  const newStatus =
    currentStatus === "active"
      ? "inactive"
      : "active";

  const { error } = await supabase
    .from("product_modules")
    .update({
      status: newStatus,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", moduleId)
    .eq("product_id", productId);

  if (error) {
    console.error(
      "Erro ao alterar módulo:",
      error
    );

    return;
  }

  revalidatePath(
    `/admin/produtos/${productId}/conteudos`
  );
}

export type ContentActionState = {
  error?: string;
  success?: string;
};

export async function createContent(
  _previousState: ContentActionState,
  formData: FormData
): Promise<ContentActionState> {
  const {
    supabase,
    authorized,
    error: authError,
  } = await getAdminClient();

  if (!authorized) {
    return {
      error:
        authError ??
        "Você não possui permissão.",
    };
  }

  const productId = getText(
    formData,
    "product_id"
  );

  const moduleId = getText(
    formData,
    "module_id"
  );

  const title = getText(
    formData,
    "title"
  );

  const description = getText(
    formData,
    "description"
  );

  const contentType = getText(
    formData,
    "content_type"
  );

  const filePath = getText(
    formData,
    "file_path"
  );

  const externalUrl = getText(
    formData,
    "external_url"
  );

  const body = getText(
    formData,
    "body"
  );

  const positionValue = Number(
    getText(formData, "position") || "0"
  );

  const isPreview =
    formData.get("is_preview") === "on";

  const allowedTypes = [
    "video",
    "pdf",
    "text",
    "file",
    "link",
  ];

  if (!productId) {
    return {
      error:
        "O produto não foi identificado.",
    };
  }

  if (!moduleId) {
    return {
      error:
        "Selecione um módulo.",
    };
  }

  if (!title) {
    return {
      error:
        "Informe o título do conteúdo.",
    };
  }

  if (
    !allowedTypes.includes(contentType)
  ) {
    return {
      error:
        "Selecione um tipo de conteúdo válido.",
    };
  }

  if (
    ["video", "link"].includes(
      contentType
    ) &&
    !externalUrl
  ) {
    return {
      error:
        "Informe o link do conteúdo.",
    };
  }

  if (
    ["pdf", "file"].includes(
      contentType
    ) &&
    !filePath
  ) {
    return {
      error:
        "Informe o caminho do arquivo.",
    };
  }

  if (
    contentType === "text" &&
    !body
  ) {
    return {
      error:
        "Digite o conteúdo do texto.",
    };
  }

  const { data: module } =
    await supabase
      .from("product_modules")
      .select("id")
      .eq("id", moduleId)
      .eq("product_id", productId)
      .maybeSingle();

  if (!module) {
    return {
      error:
        "O módulo informado não pertence a este produto.",
    };
  }

  const { error } = await supabase
    .from("product_contents")
    .insert({
      product_id: productId,
      module_id: moduleId,
      title,
      description:
        description || null,
      content_type: contentType,
      file_path:
        ["pdf", "file"].includes(
          contentType
        )
          ? filePath
          : null,
      external_url:
        ["video", "link"].includes(
          contentType
        )
          ? externalUrl
          : null,
      body:
        contentType === "text"
          ? body
          : null,
      position: Number.isFinite(
        positionValue
      )
        ? positionValue
        : 0,
      status: "active",
      is_preview: isPreview,
      updated_at:
        new Date().toISOString(),
    });

  if (error) {
    console.error(
      "Erro ao criar conteúdo:",
      error
    );

    return {
      error:
        error.message ||
        "Não foi possível criar o conteúdo.",
    };
  }

  revalidatePath(
    `/admin/produtos/${productId}/conteudos`
  );

  revalidatePath(
    `/produtos`
  );

  return {
    success:
      "Conteúdo criado com sucesso.",
  };
}

export async function toggleContentStatus(
  formData: FormData
) {
  const {
    supabase,
    authorized,
  } = await getAdminClient();

  if (!authorized) {
    return;
  }

  const contentId = getText(
    formData,
    "content_id"
  );

  const productId = getText(
    formData,
    "product_id"
  );

  const currentStatus = getText(
    formData,
    "current_status"
  );

  if (!contentId || !productId) {
    return;
  }

  const newStatus =
    currentStatus === "active"
      ? "inactive"
      : "active";

  const { error } = await supabase
    .from("product_contents")
    .update({
      status: newStatus,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", contentId)
    .eq("product_id", productId);

  if (error) {
    console.error(
      "Erro ao alterar conteúdo:",
      error
    );

    return;
  }

  revalidatePath(
    `/admin/produtos/${productId}/conteudos`
  );
}