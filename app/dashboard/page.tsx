import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { ProductCarousel } from "@/components/dashboard/product-carousel";
import type { DashboardProduct } from "@/components/dashboard/product-card";
import { MemberShell } from "@/components/layout/member-shell";
import { createClient } from "@/lib/supabase/server";

type AccessProductRelation =
  | DashboardProduct
  | DashboardProduct[]
  | null;

type UserAccess = {
  id: string;
  granted_at: string;
  products: AccessProductRelation;
};

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

  const {
    data: accessData,
    error: accessError,
  } = await supabase
    .from("user_product_access")
    .select(`
      id,
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
    .eq("status", "active")
    .order("granted_at", {
      ascending: false,
    });

  const accesses =
    (accessData ?? []) as unknown as UserAccess[];

  const ownedProducts = accesses
    .map((access) => {
      if (Array.isArray(access.products)) {
        return access.products[0] ?? null;
      }

      return access.products;
    })
    .filter(
      (
        product
      ): product is DashboardProduct =>
        Boolean(product)
    );

  const ownedProductIds = new Set(
    ownedProducts.map((product) => product.id)
  );

  const {
    data: recommendationData,
    error: recommendationError,
  } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      description,
      thumbnail_url
    `)
    .eq("status", "active")
    .order("position", {
      ascending: true,
    })
    .limit(20);

  const recommendations = (
    (recommendationData ??
      []) as DashboardProduct[]
  ).filter(
    (product) =>
      !ownedProductIds.has(product.id)
  );

  const fullName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name?.trim();

  const accountEmail =
    profile?.email ||
    user.email ||
    "";

  const displayName =
    fullName ||
    accountEmail.split("@")[0] ||
    "Aluno";

  const firstName =
    displayName.includes("@")
      ? displayName.split("@")[0]
      : displayName.split(" ")[0] || "Aluno";

  const continueProduct =
    ownedProducts[0] ?? null;

  return (
    <MemberShell userName={displayName}>
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
        <header className="relative overflow-hidden rounded-[32px] bg-[#16111f] px-6 py-8 text-white shadow-[0_24px_70px_rgba(22,17,31,0.18)] sm:px-9 sm:py-10 lg:px-12">
          <div className="absolute -right-20 -top-32 size-80 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="absolute -bottom-40 right-44 size-72 rounded-full bg-purple-400/10 blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-white/70">
              <Sparkles
                size={14}
                className="text-violet-300"
              />

              Sua área de aprendizado
            </div>

            <p className="text-sm font-medium text-white/50 sm:text-base">
              Bem-vindo de volta
            </p>

            <h1 className="mt-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Olá, {firstName} 👋
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
              Continue aprendendo e acesse todos os
              produtos que já estão disponíveis para
              você.
            </p>

            {continueProduct ? (
              <Link
                href={`/produtos/${continueProduct.slug}`}
                className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-[#18131f] shadow-lg transition hover:-translate-y-0.5 hover:bg-violet-100"
              >
                Continuar estudando

                <ArrowRight size={18} />
              </Link>
            ) : (
              <a
                href="#recomendacoes"
                className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-[#18131f] shadow-lg transition hover:-translate-y-0.5 hover:bg-violet-100"
              >
                Conhecer produtos

                <ArrowRight size={18} />
              </a>
            )}
          </div>
        </header>

        <section
          id="meus-produtos"
          className="scroll-mt-8 pt-12"
        >
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                Sua biblioteca
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
                Meus produtos
              </h2>
            </div>

            <span className="hidden text-sm text-zinc-400 sm:block">
              {ownedProducts.length}{" "}
              {ownedProducts.length === 1
                ? "produto liberado"
                : "produtos liberados"}
            </span>
          </div>

          {accessError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Não foi possível carregar seus produtos:{" "}
              {accessError.message}
            </div>
          ) : ownedProducts.length > 0 ? (
            <ProductCarousel
              products={ownedProducts}
              owned
            />
          ) : (
            <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white p-10 text-center">
              <h3 className="text-lg font-bold text-zinc-900">
                Nenhum produto liberado ainda
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Quando você adquirir um produto, ele
                aparecerá automaticamente aqui.
              </p>
            </div>
          )}
        </section>

        <div className="my-12 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />

        <section
          id="recomendacoes"
          className="scroll-mt-8"
        >
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
              Continue evoluindo
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
              Recomendações para você
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Conheça outros materiais que podem
              complementar seus resultados.
            </p>
          </div>

          {recommendationError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Não foi possível carregar as
              recomendações.
            </div>
          ) : recommendations.length > 0 ? (
            <ProductCarousel
              products={recommendations}
              owned={false}
            />
          ) : (
            <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white p-10 text-center">
              <p className="text-sm text-zinc-500">
                Nenhuma recomendação disponível no
                momento.
              </p>
            </div>
          )}
        </section>
      </div>
    </MemberShell>
  );
}