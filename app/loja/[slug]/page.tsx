import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { MemberShell } from "@/components/layout/member-shell";
import { createClient } from "@/lib/supabase/server";

type LojaProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

  const { data: product } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      description,
      thumbnail_url
    `)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const displayName =
    profile?.full_name?.trim() ||
    profile?.email?.split("@")[0] ||
    user.email?.split("@")[0] ||
    "Aluno";

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
            {product.thumbnail_url ? (
              <img
                src={product.thumbnail_url}
                alt={product.title}
                className="h-full w-full object-cover brightness-[0.68]"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-violet-200 via-purple-100 to-white" />
            )}

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-20 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-2xl backdrop-blur-md">
                <LockKeyhole size={34} />
              </div>
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

            <div className="mt-8 rounded-3xl border border-violet-100 bg-violet-50 p-5">
              <p className="text-sm font-bold text-violet-900">
                Acesso ainda não liberado
              </p>

              <p className="mt-1 text-sm leading-6 text-violet-700">
                Em breve, o botão abaixo poderá levar
                diretamente para a página de vendas ou
                checkout configurado no painel
                administrativo.
              </p>
            </div>

            <button
              type="button"
              disabled
              className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 font-bold text-white opacity-70 sm:w-fit"
            >
              <LockKeyhole size={18} />
              Liberar produto
            </button>
          </div>
        </div>
      </div>
    </MemberShell>
  );
}