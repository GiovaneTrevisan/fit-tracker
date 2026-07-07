import Link from "next/link";
import { notFound } from "next/navigation";
import { getTreino } from "@/lib/treinos";
import { AdicionarExercicioForm } from "./adicionar-exercicio-form";
import { removerExercicio } from "./actions";

export default async function TreinoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const treino = await getTreino(id);

  if (!treino) notFound();

  async function removerAction(formData: FormData) {
    "use server";
    await removerExercicio(formData);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/treinos"
        className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Treinos
      </Link>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {treino.nome}
      </h1>

      {treino.exercicios.length === 0 ? (
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">
          Nenhum exercício ainda
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {treino.exercicios.map((ex) => {
            const reps =
              ex.repsAlvoMin === ex.repsAlvoMax
                ? `${ex.repsAlvoMin}`
                : `${ex.repsAlvoMin}–${ex.repsAlvoMax}`;
            return (
            <li
              key={ex.treinoExercicioId}
              className="flex items-center justify-between gap-4 rounded-lg border border-black/[.08] px-4 py-3 dark:border-white/[.145]"
            >
              <div>
                <p className="font-medium text-black dark:text-zinc-50">
                  {ex.nome}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {ex.grupoMuscular} · {ex.seriesAlvo} séries · {reps} reps
                </p>
              </div>
              <form action={removerAction}>
                <input
                  type="hidden"
                  name="treinoExercicioId"
                  value={ex.treinoExercicioId}
                />
                <input type="hidden" name="treinoId" value={treino.id} />
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Remover
                </button>
              </form>
            </li>
            );
          })}
        </ul>
      )}

      <AdicionarExercicioForm treinoId={treino.id} />
    </main>
  );
}
