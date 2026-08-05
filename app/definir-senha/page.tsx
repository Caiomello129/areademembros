import { updatePassword } from "./actions";

type DefinePasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function DefinePasswordPage({
  searchParams,
}: DefinePasswordPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            Crie sua senha
          </h1>

          <p className="mt-2 text-sm text-neutral-400">
            Defina a senha que será usada para acessar seus produtos.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form action={updatePassword} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-neutral-300"
            >
              Nova senha
            </label>

            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-white"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-neutral-300"
            >
              Confirme a senha
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-white"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-neutral-200"
          >
            Salvar senha e acessar
          </button>
        </form>
      </div>
    </main>
  );
}