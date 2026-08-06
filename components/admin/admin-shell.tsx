import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  LayoutDashboard,
  PlusCircle,
  ShoppingBag,
  Users,
} from "lucide-react";

type AdminShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
};

const adminLinks = [
  {
    label: "Visão geral",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Produtos",
    href: "/admin/produtos",
    icon: Boxes,
  },
  {
    label: "Novo produto",
    href: "/admin/produtos/novo",
    icon: PlusCircle,
  },
  {
    label: "Alunos",
    href: "/admin/alunos",
    icon: Users,
  },
];

export function AdminShell({
  children,
  title,
  description,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f8] text-zinc-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[270px] flex-col bg-[#100d19] px-5 py-6 text-white lg:flex">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3"
        >
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 font-black">
            M
          </div>

          <div>
            <p className="font-bold">
              Modus Admin
            </p>

            <p className="text-xs text-white/40">
              Painel administrativo
            </p>
          </div>
        </Link>

        <nav className="mt-10 space-y-2">
          {adminLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                />

                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={19} />
            Voltar para a área
          </Link>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[270px]">
        <header className="border-b border-zinc-200 bg-white px-5 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1450px] items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                Administração
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                {title}
              </h1>

              {description && (
                <p className="mt-2 text-sm text-zinc-500">
                  {description}
                </p>
              )}
            </div>

            <Link
              href="/admin/produtos/novo"
              className="hidden items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 sm:flex"
            >
              <PlusCircle size={18} />
              Novo produto
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-[1450px] px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-[24px] bg-[#100d19] p-2 text-white shadow-2xl lg:hidden">
        <Link
          href="/admin"
          className="flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] text-white/60"
        >
          <LayoutDashboard size={20} />
          Início
        </Link>

        <Link
          href="/admin/produtos"
          className="flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] text-white/60"
        >
          <ShoppingBag size={20} />
          Produtos
        </Link>

        <Link
          href="/admin/produtos/novo"
          className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 py-2 text-[10px]"
        >
          <PlusCircle size={20} />
          Novo
        </Link>

        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] text-white/60"
        >
          <ArrowLeft size={20} />
          Voltar
        </Link>
      </nav>
    </div>
  );
}