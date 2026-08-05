import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    contentId: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { contentId } = await params;

    // Cliente normal: identifica o usuário logado e respeita o RLS.
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: content, error: contentError } = await supabase
      .from("product_contents")
      .select("id, product_id, content_type, file_path")
      .eq("id", contentId)
      .eq("status", "active")
      .single();

    if (contentError || !content || !content.file_path) {
      return NextResponse.json(
        {
          error: "Arquivo não encontrado.",
          details: contentError?.message,
        },
        { status: 404 }
      );
    }

    if (
      content.content_type !== "pdf" &&
      content.content_type !== "download"
    ) {
      return NextResponse.json(
        { error: "Este conteúdo não é um arquivo para download." },
        { status: 400 }
      );
    }

    const { data: access, error: accessError } = await supabase
      .from("user_product_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", content.product_id)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle();

    if (accessError || !access) {
      return NextResponse.json(
        { error: "Você não possui acesso a este produto." },
        { status: 403 }
      );
    }

    // Cliente administrativo: usado somente após validar o acesso.
    const admin = createAdminClient();

    const { data, error: signedUrlError } = await admin.storage
      .from("member-files")
      .createSignedUrl(content.file_path, 60, {
        download: true,
      });

    if (signedUrlError || !data?.signedUrl) {
      console.error("Erro ao gerar link assinado:", signedUrlError);

      return NextResponse.json(
        {
          error: "Não foi possível gerar o download.",
          details: signedUrlError?.message,
          filePath: content.file_path,
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Erro inesperado no download:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao processar o download.",
        details:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}