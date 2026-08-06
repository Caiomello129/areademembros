import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Você precisa estar autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const { data: profile } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão de administrador.",
        },
        {
          status: 403,
        }
      );
    }

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const productId = String(
      formData.get("product_id") ?? ""
    ).trim();

    const moduleId = String(
      formData.get("module_id") ?? ""
    ).trim();

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "Nenhum arquivo foi enviado.",
        },
        {
          status: 400,
        }
      );
    }

    if (!productId) {
      return NextResponse.json(
        {
          error:
            "Produto não identificado.",
        },
        {
          status: 400,
        }
      );
    }

    if (!moduleId) {
      return NextResponse.json(
        {
          error:
            "Módulo não identificado.",
        },
        {
          status: 400,
        }
      );
    }

    const { data: product } =
      await supabase
        .from("products")
        .select("id, slug")
        .eq("id", productId)
        .maybeSingle();

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Produto não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const { data: module } =
      await supabase
        .from("product_modules")
        .select("id")
        .eq("id", moduleId)
        .eq("product_id", productId)
        .maybeSingle();

    if (!module) {
      return NextResponse.json(
        {
          error:
            "O módulo não pertence a este produto.",
        },
        {
          status: 400,
        }
      );
    }

    const maxSize =
      50 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error:
            "O arquivo ultrapassa o limite de 50 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const allowedExtensions = [
      "pdf",
      "zip",
      "rar",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "png",
      "jpg",
      "jpeg",
      "webp",
    ];

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ?? "";

    if (
      !allowedExtensions.includes(
        extension
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Esse tipo de arquivo não é permitido.",
        },
        {
          status: 400,
        }
      );
    }

    const safeName =
      sanitizeFileName(
        file.name
      );

    const uniqueName =
      `${Date.now()}-${safeName}`;

    const filePath =
      `${product.slug}/${moduleId}/${uniqueName}`;

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(arrayBuffer);

    const { error: uploadError } =
      await supabase.storage
        .from("member-files")
        .upload(
          filePath,
          buffer,
          {
            contentType:
              file.type ||
              "application/octet-stream",
            upsert: false,
          }
        );

    if (uploadError) {
      console.error(
        "Erro no upload:",
        uploadError
      );

      return NextResponse.json(
        {
          error:
            uploadError.message ||
            "Não foi possível enviar o arquivo.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      file_path: filePath,
      file_name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error(
      "Erro inesperado no upload:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao enviar o arquivo.",
      },
      {
        status: 500,
      }
    );
  }
}