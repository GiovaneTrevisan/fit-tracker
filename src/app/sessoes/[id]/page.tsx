import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessao } from "@/lib/sessoes";

const STATUS_LABEL: Record<string, string> = {
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export default async function SessaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessao = await getSessao(id);

  if (!sessao) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href={`/treinos/${sessao.treinoId}`}
        className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Voltar ao treino
      </Link>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {sessao.treinoNome}
      </h1>

      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {sessao.data.toLocaleDateString("pt-BR")} ·{" "}
        {STATUS_LABEL[sessao.status] ?? sessao.status}
      </p>

      {sessao.exercicios.length === 0 ? (
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">
          Nenhum exercício ainda
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {sessao.exercicios.map((ex) => {
            const reps =
              ex.repsAlvoMin === ex.repsAlvoMax
                ? `${ex.repsAlvoMin}`
                : `${ex.repsAlvoMin}–${ex.repsAlvoMax}`;
            return (
              <li
                key={ex.treinoExercicioId}
                className="rounded-lg border border-black/[.08] px-4 py-3 dark:border-white/[.145]"
              >
                <p className="font-medium text-black dark:text-zinc-50">
                  {ex.nome}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {ex.grupoMuscular} · {ex.seriesAlvo} séries · {reps} reps
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
