import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  LockKeyhole,
} from "lucide-react";

export type DashboardProduct = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
};

type ProductCardProps = {
  product: DashboardProduct;
  owned: boolean;
};

export function ProductCard({
  product,
  owned,
}: ProductCardProps) {
  const href = owned
    ? `/produtos/${product.slug}`
    : `/loja/${product.slug}`;

  return (
    <article className="group w-[245px] shrink-0 sm:w-[270px] xl:w-[285px]">
      <Link
        href={href}
        className="block overflow-hidden rounded-[26px] border border-black/[0.06] bg-white shadow-[0_12px_40px_rgba(24,24,27,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(24,24,27,0.13)]"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#e9e7ef]">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.title}
              className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
                owned
                  ? ""
                  : "brightness-[0.48]"
              }`}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-200 via-purple-100 to-white ${
                owned ? "" : "brightness-75"
              }`}
            >
              <BookOpen
                size={52}
                className="text-violet-400"
                strokeWidth={1.4}
              />
            </div>
          )}

          {!owned && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 text-white">
              <div className="flex size-16 items-center justify-center rounded-full border border-white/20 bg-black/30 shadow-xl backdrop-blur-md">
                <LockKeyhole
                  size={28}
                  strokeWidth={1.7}
                />
              </div>

              <span className="mt-3 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] backdrop-blur-md">
                Conteúdo bloqueado
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="line-clamp-2 min-h-14 text-lg font-bold leading-7 tracking-tight text-zinc-900">
            {product.title}
          </h3>

          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-500">
            {product.description ||
              "Acesse todos os conteúdos e materiais disponíveis neste produto."}
          </p>

          <div
            className={`mt-5 flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition ${
              owned
                ? "bg-[#18131f] text-white group-hover:bg-violet-700"
                : "bg-violet-600 text-white group-hover:bg-violet-700"
            }`}
          >
            <span>
              {owned
                ? "Acessar produto"
                : "Liberar produto"}
            </span>

            {owned ? (
              <ArrowRight size={18} />
            ) : (
              <LockKeyhole size={17} />
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}