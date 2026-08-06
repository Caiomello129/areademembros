"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  BookOpen,
  Headphones,
  Home,
  LogOut,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";
import { logout } from "@/app/login/actions";

type MemberShellProps = {
  children: ReactNode;
  userName: string;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof Home;
  section:
    | "inicio"
    | "produtos"
    | "loja"
    | "suporte"
    | "perfil";
};

const navigationItems: NavigationItem[] = [
  {
    label: "Início",
    href: "/dashboard",
    icon: Home,
    section: "inicio",
  },
  {
    label: "Meus produtos",
    href: "/dashboard#meus-produtos",
    icon: BookOpen,
    section: "produtos",
  },
  {
    label: "Loja",
    href: "/dashboard#recomendacoes",
    icon: ShoppingBag,
    section: "loja",
  },
  {
    label: "Suporte",
    href: "#",
    icon: Headphones,
    section: "suporte",
  },
];

export function MemberShell({
  children,
  userName,
}: MemberShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeSection, setActiveSection] =
    useState<
      | "inicio"
      | "produtos"
      | "loja"
      | "suporte"
      | "perfil"
    >("inicio");

  useEffect(() => {
    function updateActiveSection() {
      const hash = window.location.hash;

      if (pathname.startsWith("/produtos/")) {
        setActiveSection("produtos");
        return;
      }

      if (pathname === "/perfil") {
        setActiveSection("perfil");
        return;
      }

      if (
        hash === "#meus-produtos"
      ) {
        setActiveSection("produtos");
        return;
      }

      if (
        hash === "#recomendacoes"
      ) {
        setActiveSection("loja");
        return;
      }

      setActiveSection("inicio");
    }

    updateActiveSection();

    window.addEventListener(
      "hashchange",
      updateActiveSection
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        updateActiveSection
      );
    };
  }, [pathname]);

  function handleNavigation(
    item: NavigationItem
  ) {
    setActiveSection(item.section);

    if (
      item.section === "produtos" ||
      item.section === "loja"
    ) {
      const elementId =
        item.section === "produtos"
          ? "meus-produtos"
          : "recomendacoes";

      if (pathname === "/dashboard") {
        const element =
          document.getElementById(
            elementId
          );

        element?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        window.history.replaceState(
          null,
          "",
          `/dashboard#${elementId}`
        );

        return;
      }

      router.push(
        `/dashboard#${elementId}`
      );
    }
  }

  function isActive(
    section: NavigationItem["section"]
  ) {
    return activeSection === section;
  }

  return (
    <div className="min-h-screen bg-[#f6f6f9] text-[#18181b]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-white/5 bg-[#100d19] px-5 py-6 text-white lg:flex">
        <Link
          href="/dashboard"
          onClick={() =>
            setActiveSection("inicio")
          }
          className="flex items-center gap-3 px-3"
        >
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-lg font-black shadow-lg shadow-purple-950/40">
            M
          </div>

          <div>
            <p className="text-base font-bold tracking-tight">
              Modus Members
            </p>

            <p className="text-xs text-white/45">
              Área de membros
            </p>
          </div>
        </Link>

        <nav className="mt-10 space-y-2">
          {navigationItems.map(
            (item) => {
              const Icon = item.icon;
              const active = isActive(
                item.section
              );

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(event) => {
                    if (
                      item.section ===
                        "produtos" ||
                      item.section ===
                        "loja"
                    ) {
                      event.preventDefault();
                      handleNavigation(item);
                    } else {
                      setActiveSection(
                        item.section
                      );
                    }
                  }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={1.8}
                  />

                  {item.label}
                </Link>
              );
            }
          )}
        </nav>

        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-white/5 bg-white/[0.04] p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                <UserRound size={19} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {userName}
                </p>

                <p className="text-xs text-white/40">
                  Minha conta
                </p>
              </div>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/55 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut
                size={19}
                strokeWidth={1.8}
              />

              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="min-h-screen pb-28 lg:ml-[260px] lg:pb-10">
        {children}
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-[24px] border border-white/10 bg-[#100d19]/95 p-2 text-white shadow-2xl shadow-black/30 backdrop-blur-xl lg:hidden">
        {navigationItems
          .slice(0, 3)
          .map((item) => {
            const Icon = item.icon;
            const active = isActive(
              item.section
            );

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(event) => {
                  if (
                    item.section ===
                      "produtos" ||
                    item.section ===
                      "loja"
                  ) {
                    event.preventDefault();
                    handleNavigation(item);
                  } else {
                    setActiveSection(
                      item.section
                    );
                  }
                }}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center text-[10px] font-medium transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/45"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={1.8}
                />

                <span className="line-clamp-1">
                  {item.label}
                </span>
              </Link>
            );
          })}

        <Link
          href="#"
          onClick={() =>
            setActiveSection("perfil")
          }
          className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition ${
            isActive("perfil")
              ? "bg-white/10 text-white"
              : "text-white/45"
          }`}
        >
          <UserRound
            size={20}
            strokeWidth={1.8}
          />

          Perfil
        </Link>
      </nav>
    </div>
  );
}