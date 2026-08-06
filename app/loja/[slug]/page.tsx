import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  LockKeyhole,
  ShoppingBag,
} from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";
import { MemberShell } from "@/components/layout/member-shell";
import { createClient } from "@/lib/supabase/server";

type LojaProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatPrice(
  priceInCents?: number | null
) {
  if (
    priceInCents === null ||
    priceInCents === undefined
  ) {
    return null;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}

export default async function LojaProductPage({
  params,
}: LojaProductPageProps) {
  const { slug } = await params;
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
      store_enabled,
      store_price_cents,
      store_compare_price_cents,
      store_badge,
      store_button_text,
      store_link_type,
      store_url
    `)
    .eq("slug", slug)
    .eq("status", "active")
    .eq("store_enabled", true)
    .maybeSingle();

  if (productError || !product) {
    notFound();
  }

  /*
   * Confere se o usuário já possui o produto.
   * Se já possuir, ele será enviado direto
   * para a área interna do produto.
   */
  const { data: existingAccess } = await supabase
    .from("user_product_access")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", product.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existingAccess) {
    redirect(`/produtos/${product.slug}`);
  }

  const displayName =
    profile?.full_name?.trim() ||
    profile?.email?.split("@")[0] ||
    user.email?.split("@")[0] ||
    "Aluno";

  const currentPrice = formatPrice(
    product.store_price_cents
  );

  const comparePrice = formatPrice(
    product.store_compare_price_cents
  );

  const buttonText =
    product.store_button_text?.trim() ||
    "Liberar produto";

  const storeUrl =
    product.store_url?.trim() || null;

  const opensInNewTab =
    product.store_link_type === "external" ||
    product.store_link_type === "checkout" ||
    product.store_link_type === "sales_page";

  return (
    <MemberShell userName={displayName}>
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
        <Link
          href="/loja"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-violet-600"
        >
          <ArrowLeft size={18} />
          Voltar para a loja
        </Link>

        <div className="mt-7 grid gap-8 overflow-hidden rounded-[32px] border border-black/[0.06] bg-white p-5 shadow-[0_20px_60px_rgba(24,24,27,0.08)] md:grid-cols-[360px_1fr] md:p-7">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-zinc-100">
            {product.store_badge && (
              <span className="absolute left-4 top-4 z-20 rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-violet-700 shadow-lg">
                {product.store_badge}
              </span>
            )}

            {product.thumbnail_url ? (
              <img
                src={product.thumbnail_url}
                alt={product.title}
                className="h-full w-full object-cover brightness-[0.62]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-200 via-purple-100 to-white">
                <ShoppingBag
                  size={58}
                  className="text-violet-400"
                  strokeWidth={1.3}
                />
              </div>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="flex size-20 items-center justify-center rounded-full border border-white/20 bg-black/30 shadow-2xl backdrop-blur-md">
                <LockKeyhole size={34} />
              </div>

              <span className="mt-4 rounded-full border border-white/15 bg-black/25 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] backdrop-blur-md">
                Conteúdo bloqueado
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center py-3 md:py-8">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
              Produto disponível
            </span>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
              {product.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">
              {product.description ||
                "Conheça este produto e tenha acesso a todos os conteúdos e materiais disponíveis."}
            </p>

            {currentPrice && (
              <div className="mt-7 flex flex-wrap items-end gap-3">
                <span className="text-3xl font-black tracking-tight text-zinc-900">
                  {currentPrice}
                </span>

                {comparePrice && (
                  <span className="pb-1 text-base text-zinc-400 line-through">
                    {comparePrice}
                  </span>
                )}
              </div>
            )}

            <div className="mt-7 rounded-3xl border border-violet-100 bg-violet-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={21}
                  className="mt-0.5 shrink-0 text-violet-600"
                />

                <div>
                  <p className="text-sm font-bold text-violet-900">
                    Liberação automática
                  </p>

                  <p className="mt-1 text-sm leading-6 text-violet-700">
                    Depois que o pagamento for
                    aprovado, o produto será liberado
                    automaticamente nesta conta.
                  </p>
                </div>
              </div>
            </div>

            {storeUrl ? (
              <a
                href={storeUrl}
                target={
                  opensInNewTab
                    ? "_blank"
                    : undefined
                }
                rel={
                  opensInNewTab
                    ? "noopener noreferrer"
                    : undefined
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 font-bold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 sm:w-fit"
              >
                {buttonText}

                <ArrowUpRight size={19} />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-zinc-300 px-6 py-4 font-bold text-zinc-500 sm:w-fit"
              >
                <LockKeyhole size={18} />
                Link indisponível
              </button>
            )}

            {!storeUrl && (
              <p className="mt-3 text-sm text-zinc-400">
                O link de compra deste produto ainda
                não foi configurado.
              </p>
            )}
          </div>
        </div>
      </div>
    </MemberShell>
  );
}