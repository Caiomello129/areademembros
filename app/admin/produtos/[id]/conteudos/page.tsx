import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  File,
  FileText,
  Layers3,
  Link2,
  Pencil,
  Plus,
  Type,
  Video,
} from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { ContentForm } from "./content-form";
import {
  createModule,
  toggleContentStatus,
  toggleModuleStatus,
  updateModule,
} from "./actions";

type ProductContentsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ProductModule = {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  position: number;
  status: string;
  created_at: string;
};

type ProductContent = {
  id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  content_type: string;
  status: string;
  is_preview: boolean;
  position: number;
};

function getContentIcon(
  contentType: string
) {
  switch (contentType) {
    case "video":
      return Video;

    case "pdf":
      return FileText;

    case "text":
      return Type;

    case "file":
      return File;

    case "link":
      return Link2;

    default:
      return FileText;
  }
}

function getContentTypeLabel(
  contentType: string
) {
  switch (contentType) {
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
      return contentType;
  }
}

export default async function ProductContentsPage({
  params,
}: ProductContentsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const {
    data: product,
    error: productError,
  } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      thumbnail_url,
      status
    `)
    .eq("id", id)
    .maybeSingle();

  if (
    productError ||
    !product
  ) {
    notFound();
  }

  const {
    data: moduleData,
    error: modulesError,
  } = await supabase
    .from("product_modules")
    .select(`
      id,
      product_id,
      title,
      description,
      position,
      status,
      created_at
    `)
    .eq("product_id", id)
    .order("position", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  const {
    data: contentData,
    error: contentsError,
  } = await supabase
    .from("product_contents")
    .select(`
      id,
      module_id,
      title,
      description,
      content_type,
      status,
      is_preview,
      position
    `)
    .eq("product_id", id)
    .order("position", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  const modules =
    (moduleData ?? []) as ProductModule[];

  const contents =
    (contentData ?? []) as ProductContent[];

  function getModuleContents(
    moduleId: string
  ) {
    return contents.filter(
      (content) =>
        content.module_id === moduleId
    );
  }

  const contentsWithoutModule =
    contents.filter(
      (content) =>
        !content.module_id
    );

  return (
    <AdminShell
      title="Conteúdos do produto"
      description={`Organize módulos, aulas e materiais de ${product.title}.`}
    >
      <Link
        href="/admin/produtos"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-violet-600"
      >
        <ArrowLeft size={18} />

        Voltar para produtos
      </Link>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="h-fit rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="text-lg font-black">
                Novo módulo
              </h2>

              <p className="text-sm text-zinc-500">
                Crie uma nova seção.
              </p>
            </div>
          </div>

          <form
            action={async (
              formData
            ) => {
              "use server";

              await createModule(
                {},
                formData
              );
            }}
            className="mt-6 space-y-4"
          >
            <input
              type="hidden"
              name="product_id"
              value={product.id}
            />

            <label className="block">
              <span className="text-sm font-bold text-zinc-700">
                Nome do módulo
              </span>

              <input
                name="title"
                required
                placeholder="Ex.: Comece por aqui"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-zinc-700">
                Descrição
              </span>

              <textarea
                name="description"
                rows={4}
                placeholder="Descrição opcional do módulo."
                className="mt-2 w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-zinc-700">
                Posição
              </span>

              <input
                name="position"
                type="number"
                min="0"
                defaultValue={
                  modules.length
                }
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-bold text-white transition hover:bg-violet-700"
            >
              <Plus size={18} />

              Criar módulo
            </button>
          </form>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                Estrutura
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Módulos e conteúdos
              </h2>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-500">
              <Layers3 size={17} />

              {modules.length}{" "}
              {modules.length === 1
                ? "módulo"
                : "módulos"}
            </div>
          </div>

          {(modulesError ||
            contentsError) && (
            <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              Não foi possível carregar todos os
              conteúdos.
            </div>
          )}

          {modules.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white p-12 text-center">
              <BookOpen
                size={42}
                className="mx-auto text-zinc-300"
              />

              <h3 className="mt-4 text-xl font-black">
                Nenhum módulo criado
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Use o formulário ao lado para criar o
                primeiro módulo deste produto.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {modules.map(
                (module) => {
                  const moduleContents =
                    getModuleContents(
                      module.id
                    );

                  const active =
                    module.status ===
                    "active";

                  return (
                    <article
                      key={module.id}
                      className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm"
                    >
                      <div className="flex flex-col gap-5 border-b border-zinc-100 p-5 sm:flex-row sm:items-center">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 font-black text-violet-700">
                          {module.position + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black">
                              {module.title}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                active
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-zinc-100 text-zinc-500"
                              }`}
                            >
                              {active
                                ? "Ativo"
                                : "Oculto"}
                            </span>
                          </div>

                          {module.description && (
                            <p className="mt-1 text-sm leading-6 text-zinc-500">
                              {
                                module.description
                              }
                            </p>
                          )}

                          <p className="mt-2 text-xs text-zinc-400">
                            {
                              moduleContents.length
                            }{" "}
                            {moduleContents.length ===
                            1
                              ? "conteúdo"
                              : "conteúdos"}
                          </p>
                        </div>

                        <form
                          action={
                            toggleModuleStatus
                          }
                        >
                          <input
                            type="hidden"
                            name="module_id"
                            value={
                              module.id
                            }
                          />

                          <input
                            type="hidden"
                            name="product_id"
                            value={
                              product.id
                            }
                          />

                          <input
                            type="hidden"
                            name="current_status"
                            value={
                              module.status
                            }
                          />

                          <button
                            type="submit"
                            title={
                              active
                                ? "Ocultar módulo"
                                : "Ativar módulo"
                            }
                            className={`flex size-11 items-center justify-center rounded-2xl transition ${
                              active
                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                            }`}
                          >
                            {active ? (
                              <Eye size={19} />
                            ) : (
                              <EyeOff
                                size={19}
                              />
                            )}
                          </button>
                        </form>
                      </div>

                      <details className="group border-b border-zinc-100">
                        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50">
                          <span className="flex items-center gap-2">
                            <Pencil size={17} />

                            Editar módulo
                          </span>

                          <span className="text-zinc-400 transition group-open:rotate-180">
                            ↓
                          </span>
                        </summary>

                        <form
                          action={
                            updateModule
                          }
                          className="grid gap-4 border-t border-zinc-100 bg-zinc-50 p-5 md:grid-cols-2"
                        >
                          <input
                            type="hidden"
                            name="module_id"
                            value={
                              module.id
                            }
                          />

                          <input
                            type="hidden"
                            name="product_id"
                            value={
                              product.id
                            }
                          />

                          <label className="md:col-span-2">
                            <span className="text-sm font-bold">
                              Nome
                            </span>

                            <input
                              name="title"
                              required
                              defaultValue={
                                module.title
                              }
                              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                          </label>

                          <label className="md:col-span-2">
                            <span className="text-sm font-bold">
                              Descrição
                            </span>

                            <textarea
                              name="description"
                              rows={3}
                              defaultValue={
                                module.description ??
                                ""
                              }
                              className="mt-2 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                          </label>

                          <label>
                            <span className="text-sm font-bold">
                              Posição
                            </span>

                            <input
                              name="position"
                              type="number"
                              min="0"
                              defaultValue={
                                module.position
                              }
                              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400"
                            />
                          </label>

                          <label>
                            <span className="text-sm font-bold">
                              Status
                            </span>

                            <select
                              name="status"
                              defaultValue={
                                module.status
                              }
                              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400"
                            >
                              <option value="active">
                                Ativo
                              </option>

                              <option value="inactive">
                                Oculto
                              </option>
                            </select>
                          </label>

                          <button
                            type="submit"
                            className="rounded-2xl bg-[#18131f] px-5 py-3 font-bold text-white transition hover:bg-violet-700 md:col-span-2"
                          >
                            Salvar módulo
                          </button>
                        </form>
                      </details>

                      <div className="p-5">
                        <details className="mb-5">
                          <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-bold text-white transition hover:bg-violet-700">
                            <Plus size={18} />

                            Adicionar conteúdo
                          </summary>

                          <div className="mt-4">
                            <ContentForm
                              productId={
                                product.id
                              }
                              moduleId={
                                module.id
                              }
                              nextPosition={
                                moduleContents.length
                              }
                            />
                          </div>
                        </details>

                        {moduleContents.length >
                        0 ? (
                          <div className="space-y-3">
                            {moduleContents.map(
                              (
                                content
                              ) => {
                                const ContentIcon =
                                  getContentIcon(
                                    content.content_type
                                  );

                                const contentActive =
                                  content.status ===
                                  "active";

                                return (
                                  <div
                                    key={
                                      content.id
                                    }
                                    className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 sm:flex-row sm:items-center"
                                  >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                                      <ContentIcon
                                        size={
                                          18
                                        }
                                      />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate text-sm font-bold">
                                          {
                                            content.title
                                          }
                                        </p>

                                        {content.is_preview && (
                                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                                            Prévia
                                          </span>
                                        )}

                                        <span
                                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                            contentActive
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-zinc-100 text-zinc-500"
                                          }`}
                                        >
                                          {contentActive
                                            ? "Ativo"
                                            : "Oculto"}
                                        </span>
                                      </div>

                                      <p className="mt-1 text-xs font-semibold uppercase text-zinc-400">
                                        {getContentTypeLabel(
                                          content.content_type
                                        )}
                                        {" • "}
                                        Posição{" "}
                                        {
                                          content.position
                                        }
                                      </p>

                                      {content.description && (
                                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">
                                          {
                                            content.description
                                          }
                                        </p>
                                      )}
                                    </div>

                                    <form
                                      action={
                                        toggleContentStatus
                                      }
                                    >
                                      <input
                                        type="hidden"
                                        name="content_id"
                                        value={
                                          content.id
                                        }
                                      />

                                      <input
                                        type="hidden"
                                        name="product_id"
                                        value={
                                          product.id
                                        }
                                      />

                                      <input
                                        type="hidden"
                                        name="current_status"
                                        value={
                                          content.status
                                        }
                                      />

                                      <button
                                        type="submit"
                                        title={
                                          contentActive
                                            ? "Ocultar conteúdo"
                                            : "Ativar conteúdo"
                                        }
                                        className={`flex size-10 items-center justify-center rounded-xl transition ${
                                          contentActive
                                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                            : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                                        }`}
                                      >
                                        {contentActive ? (
                                          <Eye
                                            size={
                                              18
                                            }
                                          />
                                        ) : (
                                          <EyeOff
                                            size={
                                              18
                                            }
                                          />
                                        )}
                                      </button>
                                    </form>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
                            <p className="text-sm font-semibold text-zinc-600">
                              Nenhum conteúdo neste
                              módulo.
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                              Clique em “Adicionar
                              conteúdo” para cadastrar
                              uma aula ou material.
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}

          {contentsWithoutModule.length >
            0 && (
            <section className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-black text-amber-900">
                Conteúdos sem módulo
              </h3>

              <p className="mt-1 text-sm text-amber-700">
                Existem{" "}
                {
                  contentsWithoutModule.length
                }{" "}
                conteúdos que ainda não estão
                vinculados a um módulo.
              </p>
            </section>
          )}
        </div>
      </section>
    </AdminShell>
  );
}