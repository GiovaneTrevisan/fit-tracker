import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessao } from "@/lib/sessoes";
import { getUltimaVez } from "@/lib/ultima-vez";
import { AnotarSerieForm } from "./anotar-serie-form";
import { removerSerie } from "./actions";

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

  const ultimasVezes = await Promise.all(
    sessao.exercicios.map((ex) => getUltimaVez(ex.exercicioId, sessao.id)),
  );

  async function removerSerieAction(formData: FormData) {
    "use server";
    await removerSerie(formData);
  }

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
          {sessao.exercicios.map((ex, i) => {
            const reps =
              ex.repsAlvoMin === ex.repsAlvoMax
                ? `${ex.repsAlvoMin}`
                : `${ex.repsAlvoMin}–${ex.repsAlvoMax}`;

            const uv = ultimasVezes[i];
            const ultimaVezTexto = uv
              ? `última vez ${uv.data.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}: ${uv.series
                  .map((s) => `${s.carga}kg × ${s.reps}`)
                  .join(", ")}`
              : "primeira vez";

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
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                  {ultimaVezTexto}
                </p>

                {ex.series.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1">
                    {ex.series.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-4 text-sm text-black dark:text-zinc-50"
                      >
                        <span>
                          #{s.numero} — {s.carga}kg × {s.reps}
                        </span>
                        <form action={removerSerieAction}>
                          <input type="hidden" name="serieId" value={s.id} />
                          <input
                            type="hidden"
                            name="sessaoId"
                            value={sessao.id}
                          />
                          <button
                            type="submit"
                            className="text-sm text-red-600 hover:underline dark:text-red-400"
                          >
                            Remover
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}

                <AnotarSerieForm
                  sessaoId={sessao.id}
                  exercicioId={ex.exercicioId}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
