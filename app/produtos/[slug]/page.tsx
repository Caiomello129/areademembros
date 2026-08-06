import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Download,
  ExternalLink,
  File,
  FileText,
  LockKeyhole,
  PlayCircle,
  Type,
  Video,
} from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;

  searchParams: Promise<{
    conteudo?: string;
  }>;
};

type ProductModule = {
  id: string;
  title: string;
  description: string | null;
  position: number;
};

type ProductContent = {
  id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  content_type: string;
  file_path: string | null;
  external_url: string | null;
  body: string | null;
  position: number;
  is_preview: boolean;
};

function getContentIcon(
  type: string
) {
  switch (type) {
    case "video":
      return Video;

    case "pdf":
      return FileText;

    case "text":
      return Type;

    case "file":
      return File;

    case "link":
      return ExternalLink;

    default:
      return BookOpen;
  }
}

function getTypeLabel(
  type: string
) {
  switch (type) {
    case "video":
      return "Vídeo";

    case "pdf":
      return "PDF";

    case "text":
      return "Texto";

    case "file":
      return "Arquivo";

    case "link":
      return "Link externo";

    default:
      return "Conteúdo";
  }
}

function getVideoEmbedUrl(
  url: string | null
) {
  if (!url) {
    return null;
  }

  try {
    const parsed =
      new URL(url);

    /*
     * YouTube normal
     * youtube.com/watch?v=...
     */
    if (
      parsed.hostname.includes(
        "youtube.com"
      )
    ) {
      if (
        parsed.pathname.startsWith(
          "/embed/"
        )
      ) {
        return url;
      }

      if (
        parsed.pathname.startsWith(
          "/shorts/"
        )
      ) {
        const id =
          parsed.pathname
            .split("/")
            .filter(Boolean)[1];

        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }

      const videoId =
        parsed.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    /*
     * YouTube curto
     * youtu.be/...
     */
    if (
      parsed.hostname.includes(
        "youtu.be"
      )
    ) {
      const videoId =
        parsed.pathname
          .split("/")
          .filter(Boolean)[0];

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    /*
     * Vimeo
     */
    if (
      parsed.hostname.includes(
        "vimeo.com"
      )
    ) {
      const videoId =
        parsed.pathname
          .split("/")
          .filter(Boolean)
          .pop();

      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { slug } = await params;

  const {
    conteudo: requestedContentId,
  } = await searchParams;

  const supabase =
    await createClient();

  /*
   * 1. Usuário precisa estar logado
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * 2. Buscar produto
   */
  const {
    data: product,
    error: productError,
  } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      description,
      thumbnail_url,
      status
    `)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (
    productError ||
    !product
  ) {
    notFound();
  }

  /*
   * 3. Confirmar se o usuário possui
   * acesso ativo ao produto
   */
  const {
    data: access,
  } = await supabase
    .from("user_product_access")
    .select("id")
    .eq(
      "user_id",
      user.id
    )
    .eq(
      "product_id",
      product.id
    )
    .eq(
      "status",
      "active"
    )
    .limit(1)
    .maybeSingle();

  if (!access) {
    redirect(
      `/loja/${product.slug}`
    );
  }

  /*
   * 4. Buscar módulos ativos
   */
  const {
    data: moduleData,
    error: moduleError,
  } = await supabase
    .from("product_modules")
    .select(`
      id,
      title,
      description,
      position
    `)
    .eq(
      "product_id",
      product.id
    )
    .eq(
      "status",
      "active"
    )
    .order(
      "position",
      {
        ascending: true,
      }
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  /*
   * 5. Buscar conteúdos ativos
   */
  const {
    data: contentData,
    error: contentError,
  } = await supabase
    .from("product_contents")
    .select(`
      id,
      module_id,
      title,
      description,
      content_type,
      file_path,
      external_url,
      body,
      position,
      is_preview
    `)
    .eq(
      "product_id",
      product.id
    )
    .eq(
      "status",
      "active"
    )
    .order(
      "position",
      {
        ascending: true,
      }
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  const modules =
    (moduleData ??
      []) as ProductModule[];

  const contents =
    (contentData ??
      []) as ProductContent[];

  /*
   * Primeiro conteúdo disponível
   */
  const firstContent =
    contents[0] ?? null;

  /*
   * Se ?conteudo= tiver sido passado,
   * selecionamos aquele conteúdo.
   *
   * Caso contrário, usamos o primeiro.
   */
  const selectedContent =
    contents.find(
      (content) =>
        content.id ===
        requestedContentId
    ) ??
    firstContent;

  function getContentsByModule(
    moduleId: string
  ) {
    return contents.filter(
      (content) =>
        content.module_id ===
        moduleId
    );
  }

  const contentsWithoutModule =
    contents.filter(
      (content) =>
        !content.module_id
    );

  const embedUrl =
    selectedContent?.content_type ===
    "video"
      ? getVideoEmbedUrl(
          selectedContent.external_url
        )
      : null;

  return (
    <div className="min-h-screen bg-[#f6f6f9] text-zinc-900">
      {/* TOPO */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
            title="Voltar"
          >
            <ArrowLeft
              size={19}
            />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
              Área de membros
            </p>

            <h1 className="truncate text-base font-black sm:text-lg">
              {product.title}
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[350px_1fr]">
        {/* SIDEBAR DOS MÓDULOS */}
        <aside className="border-b border-zinc-200 bg-white lg:min-h-[calc(100vh-73px)] lg:border-b-0 lg:border-r">
          <div className="p-5 lg:sticky lg:top-[73px] lg:max-h-[calc(100vh-73px)] lg:overflow-y-auto">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                Conteúdo
              </p>

              <h2 className="mt-1 text-xl font-black">
                Módulos
              </h2>
            </div>

            {moduleError ||
            contentError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Não foi possível
                carregar os conteúdos.
              </div>
            ) : modules.length ===
              0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center">
                <BookOpen
                  size={28}
                  className="mx-auto text-zinc-300"
                />

                <p className="mt-3 text-sm font-bold">
                  Nenhum conteúdo
                  disponível
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map(
                  (
                    module,
                    moduleIndex
                  ) => {
                    const moduleContents =
                      getContentsByModule(
                        module.id
                      );

                    return (
                      <div
                        key={
                          module.id
                        }
                        className="overflow-hidden rounded-2xl border border-zinc-200"
                      >
                        <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
                          <div className="flex gap-3">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-black text-violet-700">
                              {moduleIndex +
                                1}
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-black">
                                {
                                  module.title
                                }
                              </p>

                              <p className="mt-1 text-[11px] text-zinc-400">
                                {
                                  moduleContents.length
                                }{" "}
                                {moduleContents.length ===
                                1
                                  ? "conteúdo"
                                  : "conteúdos"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {moduleContents.length >
                        0 ? (
                          <div>
                            {moduleContents.map(
                              (
                                content,
                                contentIndex
                              ) => {
                                const Icon =
                                  getContentIcon(
                                    content.content_type
                                  );

                                const selected =
                                  selectedContent?.id ===
                                  content.id;

                                return (
                                  <Link
                                    key={
                                      content.id
                                    }
                                    href={`/produtos/${product.slug}?conteudo=${content.id}`}
                                    scroll={
                                      false
                                    }
                                    className={`flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5 text-sm transition last:border-b-0 ${
                                      selected
                                        ? "bg-violet-50 text-violet-700"
                                        : "bg-white text-zinc-600 hover:bg-zinc-50"
                                    }`}
                                  >
                                    <div
                                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                                        selected
                                          ? "bg-violet-100 text-violet-700"
                                          : "bg-zinc-100 text-zinc-500"
                                      }`}
                                    >
                                      <Icon
                                        size={
                                          16
                                        }
                                      />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`truncate ${
                                          selected
                                            ? "font-bold"
                                            : "font-medium"
                                        }`}
                                      >
                                        {
                                          contentIndex +
                                            1
                                        }
                                        .{" "}
                                        {
                                          content.title
                                        }
                                      </p>

                                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                                        {getTypeLabel(
                                          content.content_type
                                        )}
                                      </p>
                                    </div>

                                    {selected && (
                                      <PlayCircle
                                        size={
                                          17
                                        }
                                        className="shrink-0"
                                      />
                                    )}
                                  </Link>
                                );
                              }
                            )}
                          </div>
                        ) : (
                          <div className="px-4 py-4 text-xs text-zinc-400">
                            Nenhum conteúdo
                            neste módulo.
                          </div>
                        )}
                      </div>
                    );
                  }
                )}

                {contentsWithoutModule.length >
                  0 && (
                  <div className="overflow-hidden rounded-2xl border border-zinc-200">
                    <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
                      <p className="text-sm font-black">
                        Outros materiais
                      </p>
                    </div>

                    {contentsWithoutModule.map(
                      (
                        content
                      ) => {
                        const Icon =
                          getContentIcon(
                            content.content_type
                          );

                        const selected =
                          selectedContent?.id ===
                          content.id;

                        return (
                          <Link
                            key={
                              content.id
                            }
                            href={`/produtos/${product.slug}?conteudo=${content.id}`}
                            scroll={
                              false
                            }
                            className={`flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5 text-sm last:border-b-0 ${
                              selected
                                ? "bg-violet-50 text-violet-700"
                                : "bg-white text-zinc-600 hover:bg-zinc-50"
                            }`}
                          >
                            <Icon
                              size={
                                17
                              }
                            />

                            <span className="truncate font-medium">
                              {
                                content.title
                              }
                            </span>
                          </Link>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ÁREA PRINCIPAL */}
        <main className="min-w-0 p-4 pb-12 sm:p-6 lg:p-8">
          {!selectedContent ? (
            <div className="flex min-h-[500px] items-center justify-center rounded-[28px] border border-dashed border-zinc-300 bg-white p-8 text-center">
              <div>
                <BookOpen
                  size={46}
                  className="mx-auto text-zinc-300"
                />

                <h2 className="mt-4 text-xl font-black">
                  Nenhum conteúdo
                  disponível
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Ainda não existem
                  aulas publicadas neste
                  produto.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-[1100px]">
              {/* CABEÇALHO DA AULA */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                    {getTypeLabel(
                      selectedContent.content_type
                    )}
                  </span>

                  {selectedContent.is_preview && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                      Prévia
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                  {
                    selectedContent.title
                  }
                </h2>

                {selectedContent.description && (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base">
                    {
                      selectedContent.description
                    }
                  </p>
                )}
              </div>

              {/* VÍDEO */}
              {selectedContent.content_type ===
                "video" && (
                <section>
                  {embedUrl ? (
                    <div className="overflow-hidden rounded-[28px] bg-black shadow-xl">
                      <div className="aspect-video">
                        <iframe
                          src={
                            embedUrl
                          }
                          title={
                            selectedContent.title
                          }
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[28px] border border-zinc-200 bg-white p-8 text-center">
                      <Video
                        size={
                          42
                        }
                        className="mx-auto text-violet-500"
                      />

                      <h3 className="mt-4 text-lg font-black">
                        Assistir vídeo
                      </h3>

                      <p className="mt-2 text-sm text-zinc-500">
                        Este endereço de
                        vídeo não pode ser
                        incorporado
                        diretamente.
                      </p>

                      {selectedContent.external_url && (
                        <a
                          href={
                            selectedContent.external_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white transition hover:bg-violet-700"
                        >
                          <ExternalLink
                            size={
                              18
                            }
                          />

                          Abrir vídeo
                        </a>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* TEXTO */}
              {selectedContent.content_type ===
                "text" && (
                <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="prose prose-zinc max-w-none">
                    <div className="whitespace-pre-wrap text-[15px] leading-8 text-zinc-700">
                      {
                        selectedContent.body
                      }
                    </div>
                  </div>
                </section>
              )}

              {/* PDF */}
              {selectedContent.content_type ===
                "pdf" && (
                <section className="rounded-[28px] border border-zinc-200 bg-white p-7 shadow-sm sm:p-10">
                  <div className="mx-auto max-w-xl text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                      <FileText
                        size={
                          30
                        }
                      />
                    </div>

                    <h3 className="mt-5 text-xl font-black">
                      Material em PDF
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Clique abaixo para
                      baixar este material
                      de forma segura.
                    </p>

                    {selectedContent.file_path ? (
                      <a
                        href={`/api/download/${selectedContent.id}`}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3.5 font-bold text-white transition hover:bg-violet-700"
                      >
                        <Download
                          size={
                            19
                          }
                        />

                        Baixar PDF
                      </a>
                    ) : (
                      <p className="mt-5 text-sm font-semibold text-red-600">
                        Arquivo
                        indisponível.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* ARQUIVO */}
              {selectedContent.content_type ===
                "file" && (
                <section className="rounded-[28px] border border-zinc-200 bg-white p-7 shadow-sm sm:p-10">
                  <div className="mx-auto max-w-xl text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <File
                        size={
                          30
                        }
                      />
                    </div>

                    <h3 className="mt-5 text-xl font-black">
                      Arquivo para
                      download
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Este material está
                      disponível apenas
                      para membros com
                      acesso ao produto.
                    </p>

                    {selectedContent.file_path ? (
                      <a
                        href={`/api/download/${selectedContent.id}`}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3.5 font-bold text-white transition hover:bg-violet-700"
                      >
                        <Download
                          size={
                            19
                          }
                        />

                        Baixar arquivo
                      </a>
                    ) : (
                      <p className="mt-5 text-sm font-semibold text-red-600">
                        Arquivo
                        indisponível.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* LINK EXTERNO */}
              {selectedContent.content_type ===
                "link" && (
                <section className="rounded-[28px] border border-zinc-200 bg-white p-7 shadow-sm sm:p-10">
                  <div className="mx-auto max-w-xl text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <ExternalLink
                        size={
                          30
                        }
                      />
                    </div>

                    <h3 className="mt-5 text-xl font-black">
                      Conteúdo externo
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Este conteúdo será
                      aberto em uma nova
                      aba.
                    </p>

                    {selectedContent.external_url ? (
                      <a
                        href={
                          selectedContent.external_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3.5 font-bold text-white transition hover:bg-violet-700"
                      >
                        <ExternalLink
                          size={
                            19
                          }
                        />

                        Acessar conteúdo
                      </a>
                    ) : (
                      <p className="mt-5 text-sm font-semibold text-red-600">
                        Link
                        indisponível.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* SEGURANÇA */}
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-400">
                <LockKeyhole
                  size={15}
                />

                Conteúdo exclusivo para
                membros com acesso a este
                produto.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}