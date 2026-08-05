import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, title, slug, description, thumbnail_url")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!product) {
    notFound();
  }

  const { data: access } = await supabase
    .from("user_product_access")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", product.id)
    .eq("status", "active")
    .maybeSingle();

  if (!access) {
    redirect("/dashboard");
  }

  const { data: modules } = await supabase
    .from("product_modules")
    .select(`
      id,
      title,
      description,
      position,
      product_contents (
        id,
        title,
        description,
        content_type,
        file_path,
        external_url,
        body,
        position
      )
    `)
    .eq("product_id", product.id)
    .eq("status", "active")
    .order("position", { ascending: true });

  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm text-neutral-400 transition hover:text-white"
        >
          ← Voltar para meus produtos
        </Link>

        <header className="mt-6 rounded-3xl border border-neutral-800 bg-neutral-900 p-8">
          <p className="text-sm text-neutral-400">Produto liberado</p>

          <h1 className="mt-2 text-3xl font-bold">{product.title}</h1>

          {product.description && (
            <p className="mt-3 max-w-2xl text-neutral-400">
              {product.description}
            </p>
          )}
        </header>

        <section className="mt-8 space-y-5">
          {!modules || modules.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
              <p className="text-neutral-400">
                Os materiais deste produto ainda serão adicionados.
              </p>
            </div>
          ) : (
            modules.map((module) => (
              <article
                key={module.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <h2 className="text-xl font-semibold">{module.title}</h2>

                {module.description && (
                  <p className="mt-2 text-sm text-neutral-400">
                    {module.description}
                  </p>
                )}

                <div className="mt-5 space-y-3">
                  {module.product_contents
                    ?.sort((a, b) => a.position - b.position)
                    .map((content) => (
                      <div
                        key={content.id}
                        className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                      >
                        <h3 className="font-medium">{content.title}</h3>

                        {content.description && (
                          <p className="mt-1 text-sm text-neutral-400">
                            {content.description}
                          </p>
                        )}

                        {content.content_type === "text" && content.body && (
                          <div className="mt-4 whitespace-pre-line text-sm text-neutral-300">
                            {content.body}
                          </div>
                        )}

                        {(content.content_type === "pdf" ||
                        content.content_type === "download") &&
                        content.file_path && (
                            <a
                            href={`/api/download/${content.id}`}
                            className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
                            >
                            Baixar material
                            </a>
                        )}

                        {(content.content_type === "link" ||
                          content.content_type === "video") &&
                          content.external_url && (
                            <a
                              href={content.external_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
                            >
                              Abrir conteúdo
                            </a>
                          )}
                      </div>
                    ))}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}