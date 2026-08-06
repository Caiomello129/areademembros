"use client";

import {
  useActionState,
  useState,
} from "react";
import {
  AlertCircle,
  ImageIcon,
  Link2,
  Package,
  Save,
  ShoppingBag,
} from "lucide-react";
import {
  updateProduct,
  type UpdateProductState,
} from "./actions";

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  ggcheckout_product_id: string | null;
  status: string;
  position: number | null;
  store_enabled: boolean;
  store_price_cents: number | null;
  store_compare_price_cents: number | null;
  store_badge: string | null;
  store_button_text: string | null;
  store_link_type: string | null;
  store_url: string | null;
};

type EditProductFormProps = {
  product: Product;
};

const initialState: UpdateProductState = {};

function centsToInput(value: number | null) {
  if (value === null) return "";

  return (value / 100)
    .toFixed(2)
    .replace(".", ",");
}

export function EditProductForm({
  product,
}: EditProductFormProps) {
  const [state, formAction, pending] =
    useActionState(
      updateProduct,
      initialState
    );

  const [storeEnabled, setStoreEnabled] =
    useState(product.store_enabled);

  return (
    <form
      action={formAction}
      className="grid gap-6 xl:grid-cols-[1fr_360px]"
    >
      <input
        type="hidden"
        name="id"
        value={product.id}
      />

      <div className="space-y-6">
        {state.error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} />
            {state.error}
          </div>
        )}

        <section className="rounded-[28px] border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Package size={21} />
            </div>

            <div>
              <h2 className="text-lg font-black">
                Informações principais
              </h2>

              <p className="text-sm text-zinc-500">
                Dados exibidos na plataforma.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-sm font-bold">
                Nome do produto
              </span>

              <input
                name="title"
                required
                defaultValue={product.title}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none focus:border-violet-400"
              />
            </label>

            <label>
              <span className="text-sm font-bold">
                Slug
              </span>

              <input
                name="slug"
                defaultValue={product.slug}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none focus:border-violet-400"
              />
            </label>

            <label>
              <span className="text-sm font-bold">
                Posição
              </span>

              <input
                name="position"
                type="number"
                min="0"
                defaultValue={product.position ?? 0}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none focus:border-violet-400"
              />
            </label>

            <label className="md:col-span-2">
              <span className="text-sm font-bold">
                Descrição
              </span>

              <textarea
                name="description"
                rows={5}
                defaultValue={
                  product.description ?? ""
                }
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none focus:border-violet-400"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <ImageIcon size={21} />

            <h2 className="text-lg font-black">
              Imagem
            </h2>
          </div>

          <input
            name="thumbnail_url"
            type="url"
            defaultValue={
              product.thumbnail_url ?? ""
            }
            placeholder="https://..."
            className="mt-6 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none focus:border-violet-400"
          />
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <Link2 size={21} />

            <h2 className="text-lg font-black">
              GG Checkout
            </h2>
          </div>

          <input
            name="ggcheckout_product_id"
            required
            defaultValue={
              product.ggcheckout_product_id ??
              ""
            }
            className="mt-6 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 font-mono outline-none focus:border-violet-400"
          />
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <ShoppingBag size={21} />

            <h2 className="text-lg font-black">
              Configurações da loja
            </h2>
          </div>

          <label className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div>
              <p className="text-sm font-bold">
                Mostrar na loja
              </p>

              <p className="text-xs text-zinc-500">
                Exibe o produto para novos compradores.
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
              <span className="text-sm font-bold">
                Preço atual
              </span>

              <input
                name="store_price"
                defaultValue={centsToInput(
                  product.store_price_cents
                )}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5"
              />
            </label>

            <label>
              <span className="text-sm font-bold">
                Preço anterior
              </span>

              <input
                name="store_compare_price"
                defaultValue={centsToInput(
                  product.store_compare_price_cents
                )}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5"
              />
            </label>

            <label>
              <span className="text-sm font-bold">
                Etiqueta
              </span>

              <input
                name="store_badge"
                defaultValue={
                  product.store_badge ?? ""
                }
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5"
              />
            </label>

            <label>
              <span className="text-sm font-bold">
                Texto do botão
              </span>

              <input
                name="store_button_text"
                defaultValue={
                  product.store_button_text ??
                  "Liberar produto"
                }
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5"
              />
            </label>

            <label>
              <span className="text-sm font-bold">
                Tipo do link
              </span>

              <select
                name="store_link_type"
                defaultValue={
                  product.store_link_type ??
                  "checkout"
                }
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5"
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
              <span className="text-sm font-bold">
                Link
              </span>

              <input
                name="store_url"
                type="url"
                defaultValue={
                  product.store_url ?? ""
                }
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5"
              />
            </label>
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-[28px] border border-zinc-200 bg-white p-6 xl:sticky xl:top-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
          Publicação
        </p>

        <label className="mt-5 block">
          <span className="text-sm font-bold">
            Status
          </span>

          <select
            name="status"
            defaultValue={product.status}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5"
          >
            <option value="active">
              Ativo
            </option>

            <option value="inactive">
              Inativo
            </option>
          </select>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 font-bold text-white disabled:opacity-60"
        >
          <Save size={19} />

          {pending
            ? "Salvando..."
            : "Salvar alterações"}
        </button>
      </aside>
    </form>
  );
}