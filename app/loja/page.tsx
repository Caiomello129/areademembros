import { redirect } from "next/navigation";
import {
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { MemberShell } from "@/components/layout/member-shell";
import {
  ProductCard,
  type DashboardProduct,
} from "@/components/dashboard/product-card";
import { createClient } from "@/lib/supabase/server";

type AccessRelation = {
  products:
    | {
        id: string;
      }
    | {
        id: string;
      }[]
    | null;
};

export default async function LojaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data: accessData } = await supabase
    .from("user_product_access")
    .select(`
      products (
        id
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active");

  const accesses =
    (accessData ?? []) as unknown as AccessRelation[];

  const ownedProductIds = new Set(
    accesses
      .map((access) => {
        if (Array.isArray(access.products)) {
          return access.products[0]?.id;
        }

        return access.products?.id;
      })
      .filter(
        (id): id is string =>
          Boolean(id)
      )
  );

  const {
    data: productData,
    error: productsError,
  } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      description,
      thumbnail_url,
      store_price_cents,
      store_compare_price_cents,
      store_badge,
      store_button_text,
      store_link_type,
      store_url
    `)
    .eq("status", "active")
    .eq("store_enabled", true)
    .order("position", {
      ascending: true,
    });

  const products =
    (productData ?? []) as DashboardProduct[];

  const displayName =
    profile?.full_name?.trim() ||
    profile?.email?.split("@")[0] ||
    user.email?.split("@")[0] ||
    "Aluno";

  return (
    <MemberShell userName={displayName}>
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
        <header className="relative overflow-hidden rounded-[32px] bg-[#16111f] px-6 py-9 text-white shadow-[0_24px_70px_rgba(22,17,31,0.18)] sm:px-10 lg:px-12">
          <div className="absolute -right-24 -top-28 size-80 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="absolute -bottom-36 left-1/2 size-72 rounded-full bg-purple-400/10 blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-white/70">
              <Sparkles
                size={14}
                className="text-violet-300"
              />

              Conteúdos selecionados
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Loja Modus
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
              Encontre novos materiais para continuar
              aprendendo, evoluindo e ampliando seus
              resultados.
            </p>
          </div>
        </header>

        <section className="pt-12">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                Catálogo
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
                Todos os produtos
              </h2>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-500 sm:flex">
              <ShoppingBag size={16} />

              {products.length}{" "}
              {products.length === 1
                ? "produto"
                : "produtos"}
            </div>
          </div>

          {productsError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Não foi possível carregar a loja:{" "}
              {productsError.message}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white p-12 text-center">
              <ShoppingBag
                size={38}
                className="mx-auto text-zinc-300"
              />

              <h3 className="mt-4 text-lg font-bold text-zinc-900">
                Nenhum produto disponível
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Novos produtos aparecerão aqui quando
                forem cadastrados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 justify-items-center gap-7 sm:grid-cols-2 sm:justify-items-start xl:grid-cols-3 2xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  owned={ownedProductIds.has(
                    product.id
                  )}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </MemberShell>
  );
}