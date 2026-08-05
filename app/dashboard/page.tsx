import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  const { data: accesses, error } = await supabase
    .from("user_product_access")
    .select(`
      id,
      status,
      granted_at,
      products (
        id,
        title,
        slug,
        description,
        thumbnail_url
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active");

  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-neutral-800 pb-6">
          <div>
            <p className="text-sm text-neutral-400">Área de membros</p>

            <h1 className="mt-1 text-3xl font-bold">
              Olá, {profile?.full_name || profile?.email || user.email}
            </h1>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-xl border border-neutral-700 px-4 py-2 text-sm transition hover:bg-neutral-800"
            >
              Sair
            </button>
          </form>
        </header>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Meus produtos</h2>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-900 bg-red-950/40 p-5 text-red-300">
              Erro ao buscar os produtos: {error.message}
            </div>
          )}

          {!error && (!accesses || accesses.length === 0) && (
            <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
              <p className="text-neutral-400">
                Você ainda não possui nenhum produto liberado.
              </p>
            </div>
          )}

          {!error && accesses && accesses.length > 0 && (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {accesses.map((access) => {
                const product = Array.isArray(access.products)
                  ? access.products[0]
                  : access.products;

                if (!product) return null;

                return (
                  <article
                    key={access.id}
                    className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
                  >
                    <div className="flex h-44 items-center justify-center bg-neutral-800">
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-neutral-500">
                          Imagem do produto
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-semibold">
                        {product.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm text-neutral-400">
                        {product.description}
                      </p>

                      <Link
                        href={`/produtos/${product.slug}`}
                        className="mt-5 block rounded-xl bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-neutral-200"
                      >
                        Acessar produto
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}