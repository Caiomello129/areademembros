import Link from "next/link";
import {
  Eye,
  EyeOff,
  Pencil,
  PlusCircle,
} from "lucide-react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";

function formatPrice(
  value?: number | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "Não definido";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export default async function AdminProductsPage() {
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
    data: products,
    error,
  } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      thumbnail_url,
      status,
      store_enabled,
      store_price_cents,
      ggcheckout_product_id,
      position
    `)
    .order("position", {
      ascending: true,
    });

  return (
    <AdminShell
      title="Produtos"
      description="Gerencie os produtos da loja e da área de membros."
    >
      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white sm:hidden"
        >
          <PlusCircle size={18} />
          Novo produto
        </Link>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          Não foi possível carregar os produtos:{" "}
          {error.message}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white p-12 text-center">
          <h2 className="text-xl font-black">
            Nenhum produto cadastrado
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Cadastre seu primeiro produto para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="flex flex-col gap-5 rounded-[26px] border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="aspect-[4/5] w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-100 sm:w-24">
                {product.thumbnail_url ? (
                  <img
                    src={product.thumbnail_url}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                    Sem imagem
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-black">
                    {product.title}
                  </h2>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      product.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>

                <p className="mt-1 text-sm text-zinc-400">
                  /{product.slug}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-500">
                  <span>
                    Loja:{" "}
                    <strong className="text-zinc-800">
                      {product.store_enabled
                        ? "Visível"
                        : "Oculto"}
                    </strong>
                  </span>

                  <span>
                    Preço:{" "}
                    <strong className="text-zinc-800">
                      {formatPrice(
                        product.store_price_cents
                      )}
                    </strong>
                  </span>

                  <span>
                    GG:{" "}
                    <strong className="text-zinc-800">
                      {product.ggcheckout_product_id ||
                        "Não vinculado"}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${
                    product.store_enabled
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                  title={
                    product.store_enabled
                      ? "Visível na loja"
                      : "Oculto na loja"
                  }
                >
                  {product.store_enabled ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </div>

                <Link
                  href={`/admin/produtos/${product.id}/editar`}
                  className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 transition hover:bg-violet-100"
                  title="Editar produto"
                >
                  <Pencil size={18} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}