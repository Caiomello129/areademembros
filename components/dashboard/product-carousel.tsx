"use client";

import { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DashboardProduct,
  ProductCard,
} from "./product-card";

type ProductCarouselProps = {
  products: DashboardProduct[];
  owned: boolean;
};

export function ProductCarousel({
  products,
  owned,
}: ProductCarouselProps) {
  const carouselRef =
    useRef<HTMLDivElement>(null);

  function scrollCarousel(
    direction: "left" | "right"
  ) {
    const carousel = carouselRef.current;

    if (!carousel) return;

    const distance =
      Math.min(carousel.clientWidth * 0.85, 620);

    carousel.scrollBy({
      left:
        direction === "right"
          ? distance
          : -distance,
      behavior: "smooth",
    });
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="group/carousel relative">
      <div
        ref={carouselRef}
        className="product-carousel flex touch-pan-y snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain py-3 pr-5 select-none"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="shrink-0 snap-start"
          >
            <ProductCard
              product={product}
              owned={owned}
            />
          </div>
        ))}
      </div>

      {products.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              scrollCarousel("left")
            }
            aria-label="Produtos anteriores"
            className="absolute left-0 top-[42%] z-20 hidden size-11 -translate-x-1/2 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-800 shadow-xl transition hover:scale-105 hover:bg-zinc-900 hover:text-white md:flex"
          >
            <ChevronLeft size={21} />
          </button>

          <button
            type="button"
            onClick={() =>
              scrollCarousel("right")
            }
            aria-label="Próximos produtos"
            className="absolute right-0 top-[42%] z-20 hidden size-11 translate-x-1/2 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-800 shadow-xl transition hover:scale-105 hover:bg-zinc-900 hover:text-white md:flex"
          >
            <ChevronRight size={21} />
          </button>
        </>
      )}
    </div>
  );
}