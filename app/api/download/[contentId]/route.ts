import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type DownloadRouteProps = {
  params: Promise<{
    contentId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: DownloadRouteProps
) {
  try {
    const { contentId } = await params;

    const supabase = await createClient();

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

    /*
     * 1. Buscar o conteúdo
     */
    const {
      data: content,
      error: contentError,
    } = await supabase
      .from("product_contents")
      .select(`
        id,
        product_id,
        title,
        content_type,
        file_path,
        status,
        is_preview
      `)
      .eq("id", contentId)
      .maybeSingle();

    if (
      contentError ||
      !content
    ) {
      console.error(
        "Erro ao buscar conteúdo:",
        contentError
      );

      return NextResponse.json(
        {
          error:
            "Conteúdo não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * 2. Conteúdo precisa estar ativo
     */
    if (
      content.status !== "active"
    ) {
      return NextResponse.json(
        {
          error:
            "Este conteúdo não está disponível.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 3. Precisa possuir arquivo
     */
    if (!content.file_path) {
      return NextResponse.json(
        {
          error:
            "Arquivo não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * 4. Verificar acesso do usuário
     *
     * Estamos usando uma lista com limit(1)
     * em vez de maybeSingle(), porque seu
     * banco atualmente possui alguns acessos
     * duplicados para o mesmo usuário/produto.
     */
    const {
      data: accesses,
      error: accessError,
    } = await supabase
      .from("user_product_access")
      .select("id")
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "product_id",
        content.product_id
      )
      .eq(
        "status",
        "active"
      )
      .limit(1);

    if (accessError) {
      console.error(
        "Erro ao verificar acesso:",
        accessError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar seu acesso.",
        },
        {
          status: 500,
        }
      );
    }

    const hasAccess =
      !!accesses &&
      accesses.length > 0;

    /*
     * Se não possui acesso e o conteúdo
     * também não é uma prévia, bloqueia.
     */
    if (
      !hasAccess &&
      !content.is_preview
    ) {
      console.log(
        "Download bloqueado:",
        {
          loggedUserId:
            user.id,
          contentId:
            content.id,
          contentProductId:
            content.product_id,
          accessesFound:
            accesses?.length ?? 0,
        }
      );

      return NextResponse.json(
        {
          error:
            "Você não possui acesso a este produto.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 5. Gerar URL assinada temporária
     *
     * O bucket continua privado.
     * O link fica válido por 60 segundos.
     */
    const {
      data: signedData,
      error: signedError,
    } = await supabase.storage
      .from("member-files")
      .createSignedUrl(
        content.file_path,
        60
      );

    if (
      signedError ||
      !signedData?.signedUrl
    ) {
      console.error(
        "Erro ao gerar URL assinada:",
        signedError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível liberar o arquivo.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 6. Redirecionar para o arquivo
     */
    return NextResponse.redirect(
      signedData.signedUrl
    );
  } catch (error) {
    console.error(
      "Erro inesperado no download:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao liberar o arquivo.",
      },
      {
        status: 500,
      }
    );
  }
}