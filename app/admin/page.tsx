import Link from "next/link";
import {
  Boxes,
  ShoppingBag,
  Users,
  Webhook,
} from "lucide-react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
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

  const [
    productsResult,
    usersResult,
    accessesResult,
    webhooksResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("profiles")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("user_product_access")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    supabase
      .from("webhook_events")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "failed"),
  ]);

  const cards = [
    {
      label: "Produtos",
      value: productsResult.count ?? 0,
      icon: Boxes,
      href: "/admin/produtos",
    },
    {
      label: "Usuários",
      value: usersResult.count ?? 0,
      icon: Users,
      href: "/admin/alunos",
    },
    {
      label: "Acessos ativos",
      value: accessesResult.count ?? 0,
      icon: ShoppingBag,
      href: "/admin/alunos",
    },
    {
      label: "Erros de webhook",
      value: webhooksResult.count ?? 0,
      icon: Webhook,
      href: "/admin",
    },
  ];

  return (
    <AdminShell
      title="Visão geral"
      description="Acompanhe os principais dados da sua plataforma."
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-[26px] border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Icon size={23} />
                </div>

                <span className="text-3xl font-black">
                  {card.value}
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-zinc-500">
                {card.label}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-zinc-200 bg-white p-6">
          <h2 className="text-xl font-black">
            Ações rápidas
          </h2>

          <div className="mt-5 space-y-3">
            <Link
              href="/admin/produtos/novo"
              className="flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-4 font-semibold transition hover:border-violet-300 hover:bg-violet-50"
            >
              Cadastrar novo produto
              <span>→</span>
            </Link>

            <Link
              href="/admin/produtos"
              className="flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-4 font-semibold transition hover:border-violet-300 hover:bg-violet-50"
            >
              Gerenciar produtos
              <span>→</span>
            </Link>
          </div>
        </section>

        <section className="rounded-[28px] bg-[#16111f] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
            Plataforma
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Sua estrutura administrativa começou
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/55">
            Agora vamos adicionar cadastro, edição,
            imagens, links de venda, GG Checkout,
            módulos e aulas.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}