import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { getSessao } from "@/lib/sessoes";
import { getUltimaVez } from "@/lib/ultima-vez";
import { AnotarSerieForm } from "./anotar-serie-form";
import { concluirSessao, removerSerie } from "./actions";

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

  const emAndamento = sessao.status === "EM_ANDAMENTO";

  async function removerSerieAction(formData: FormData) {
    "use server";
    await removerSerie(formData);
  }

  async function concluirAction(formData: FormData) {
    "use server";
    await concluirSessao(String(formData.get("sessaoId") ?? ""));
  }

  return (
    <main className="py-12">
      <Container>
        <Link
          href={`/treinos/${sessao.treinoId}`}
          className="text-sm text-zinc-600 hover:underline"
        >
          ← Voltar ao treino
        </Link>

        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            {sessao.treinoNome}
          </h1>
          {sessao.status === "CONCLUIDA" && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Concluída
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-zinc-600">
          {sessao.data.toLocaleDateString("pt-BR")} ·{" "}
          {STATUS_LABEL[sessao.status] ?? sessao.status}
        </p>

        {sessao.exercicios.length === 0 ? (
          <p className="mt-6 text-zinc-600">
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
                  className="rounded-lg border border-black/[.08] px-4 py-3"
                >
                  <p className="font-medium text-black">
                    {ex.nome}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {ex.grupoMuscular} · {ex.seriesAlvo} séries · {reps} reps
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {ultimaVezTexto}
                  </p>

                  {ex.series.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1">
                      {ex.series.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-4 text-sm text-black"
                        >
                          <span>
                            #{s.numero} — {s.carga}kg × {s.reps}
                          </span>
                          {emAndamento && (
                            <form action={removerSerieAction}>
                              <input type="hidden" name="serieId" value={s.id} />
                              <input
                                type="hidden"
                                name="sessaoId"
                                value={sessao.id}
                              />
                              <button
                                type="submit"
                                className="text-sm text-red-600 hover:underline"
                              >
                                Remover
                              </button>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {emAndamento && (
                    <AnotarSerieForm
                      sessaoId={sessao.id}
                      exercicioId={ex.exercicioId}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {emAndamento && (
          <form action={concluirAction} className="mt-8">
            <input type="hidden" name="sessaoId" value={sessao.id} />
            <button
              type="submit"
              className="rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-colors hover:bg-[#383838]"
            >
              Concluir treino
            </button>
          </form>
        )}
      </Container>
    </main>
  );
}
