"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const scrollPrevious = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div
        ref={emblaRef}
        className="overflow-hidden"
      >
        <div className="flex gap-5 py-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              owned={owned}
            />
          ))}
        </div>
      </div>

      {products.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrevious}
            aria-label="Produtos anteriores"
            className="absolute left-0 top-[42%] hidden size-11 -translate-x-1/2 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-800 shadow-xl transition hover:scale-105 hover:bg-zinc-900 hover:text-white md:flex"
          >
            <ChevronLeft size={21} />
          </button>

          <button
            type="button"
            onClick={scrollNext}
            aria-label="Próximos produtos"
            className="absolute right-0 top-[42%] hidden size-11 translate-x-1/2 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-800 shadow-xl transition hover:scale-105 hover:bg-zinc-900 hover:text-white md:flex"
          >
            <ChevronRight size={21} />
          </button>
        </>
      )}
    </div>
  );
}