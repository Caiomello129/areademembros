"use client";

import {
  useActionState,
  useState,
} from "react";
import {
  AlertCircle,
  ImageIcon,
  Link2,
  PackagePlus,
  Save,
  ShoppingBag,
} from "lucide-react";
import {
  createProduct,
  type CreateProductState,
} from "./actions";

const initialState: CreateProductState = {};

export function ProductForm() {
  const [state, formAction, pending] =
    useActionState(
      createProduct,
      initialState
    );

  const [storeEnabled, setStoreEnabled] =
    useState(true);

  return (
    <form
      action={formAction}
      className="grid gap-6 xl:grid-cols-[1fr_360px]"
    >
      <div className="space-y-6">
        {state.error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <span>{state.error}</span>
          </div>
        )}

        <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <PackagePlus size={21} />
            </div>

            <div>
              <h2 className="text-lg font-black">
                Informações principais
              </h2>

              <p className="text-sm text-zinc-500">
                Dados usados na área de membros.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-sm font-bold text-zinc-700">
                Nome do produto *
              </span>

              <input
                name="title"
                required
                placeholder="Ex.: 150 Receitas de Perfumes"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-zinc-700">
                Slug
              </span>

              <input
                name="slug"
                placeholder="150-receitas-de-perfumes"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />

              <span className="mt-1 block text-xs text-zinc-400">
                Se ficar vazio, será gerado
                automaticamente.
              </span>
            </label>

            <label>
              <span className="text-sm font-bold text-zinc-700">
                Posição
              </span>

              <input
                name="position"
                type="number"
                defaultValue="0"
                min="0"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label className="md:col-span-2">
              <span className="text-sm font-bold text-zinc-700">
                Descrição
              </span>

              <textarea
                name="description"
                rows={5}
                placeholder="Explique de forma clara o que o cliente encontrará no produto."
                className="mt-2 w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <ImageIcon size={21} />
            </div>

            <div>
              <h2 className="text-lg font-black">
                Imagem
              </h2>

              <p className="text-sm text-zinc-500">
                Use uma imagem vertical 1080x1350.
              </p>
            </div>
          </div>

          <label className="mt-6 block">
            <span className="text-sm font-bold text-zinc-700">
              URL da imagem
            </span>

            <input
              name="thumbnail_url"
              type="url"
              placeholder="https://..."
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />

            <span className="mt-1 block text-xs text-zinc-400">
              Depois vamos adicionar upload direto
              pelo painel.
            </span>
          </label>
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Link2 size={21} />
            </div>

            <div>
              <h2 className="text-lg font-black">
                GG Checkout
              </h2>

              <p className="text-sm text-zinc-500">
                Vincula a compra ao produto correto.
              </p>
            </div>
          </div>

          <label className="mt-6 block">
            <span className="text-sm font-bold text-zinc-700">
              ID do produto na GG Checkout *
            </span>

            <input
              name="ggcheckout_product_id"
              required
              placeholder="Ex.: sNTVkX6BOefjtFpmAIZZ"
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 font-mono outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </label>
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ShoppingBag size={21} />
            </div>

            <div>
              <h2 className="text-lg font-black">
                Configurações da loja
              </h2>

              <p className="text-sm text-zinc-500">
                Oferta exibida para alunos que ainda
                não possuem o produto.
              </p>
            </div>
          </div>

          <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div>
              <p className="text-sm font-bold">
                Mostrar na loja
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                O produto será exibido na loja e nas
                recomendações.
              </p>
            </div>

            <input
              name="store_enabled"
              type="checkbox"
              checked={storeEnabled}
              onChange={(event) =>
                setStoreEnabled(
                  event.target.checked
                )
              }
              className="size-5 accent-violet-600"
            />
          </label>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label>
              <span className="text-sm font-bold text-zinc-700">
                Preço atual
              </span>

              <input
                name="store_price"
                inputMode="decimal"
                placeholder="10,00"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-zinc-700">
                Preço anterior
              </span>

              <input
                name="store_compare_price"
                inputMode="decimal"
                placeholder="27,00"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-zinc-700">
                Etiqueta
              </span>

              <input
                name="store_badge"
                placeholder="Oferta exclusiva"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-zinc-700">
                Texto do botão
              </span>

              <input
                name="store_button_text"
                defaultValue="Liberar produto"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-zinc-700">
                Destino do botão
              </span>

              <select
                name="store_link_type"
                defaultValue="checkout"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              >
                <option value="checkout">
                  Checkout
                </option>

                <option value="sales_page">
                  Página de vendas
                </option>

                <option value="external">
                  Link externo
                </option>
              </select>
            </label>

            <label>
              <span className="text-sm font-bold text-zinc-700">
                Link
              </span>

              <input
                name="store_url"
                type="url"
                placeholder="https://..."
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
          Publicação
        </p>

        <h2 className="mt-2 text-xl font-black">
          Salvar produto
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          O produto será criado como ativo e poderá
          receber liberações automáticas da GG
          Checkout.
        </p>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={19} />

          {pending
            ? "Salvando..."
            : "Cadastrar produto"}
        </button>
      </aside>
    </form>
  );
}