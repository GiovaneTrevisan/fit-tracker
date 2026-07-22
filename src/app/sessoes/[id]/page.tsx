import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/badge";
import { Button, estilosBotao } from "@/components/button";
import { Card } from "@/components/card";
import { Container } from "@/components/container";
import { Rotulo } from "@/components/tipografia";
import { getSessao, type ExercicioDaSessao } from "@/lib/sessoes";
import { getUltimaVez } from "@/lib/ultima-vez";
import { imagemDoTreino } from "@/lib/treino-imagem";
import { AnotarSerieForm } from "./anotar-serie-form";
import { concluirSessao, removerSerie } from "./actions";

function faixaReps(min: number, max: number): string {
  return min === max ? `${min}` : `${min}–${max}`;
}

export default async function SessaoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ex?: string }>;
}) {
  const { id } = await params;
  const { ex: exParam } = await searchParams;
  const sessao = await getSessao(id);

  if (!sessao) notFound();

  const emAndamento = sessao.status === "EM_ANDAMENTO";
  const dataFmt = sessao.data.toLocaleDateString("pt-BR");

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
          className="text-rotulo text-texto-suave hover:underline"
        >
          ← Voltar ao treino
        </Link>

        <Card
          variante="forte"
          imagem={imagemDoTreino(sessao.treinoNome)}
          className="mt-2"
        >
          <h1 className="text-titulo font-semibold">{sessao.treinoNome}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variante="escuro">{dataFmt}</Badge>
            {sessao.status === "CONCLUIDA" ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Concluída
              </span>
            ) : (
              <Badge variante="escuro">Em andamento</Badge>
            )}
          </div>
        </Card>

        {sessao.exercicios.length === 0 ? (
          <Card variante="superficie" className="mt-6">
            <p className="text-texto-suave">Nenhum exercício ainda</p>
          </Card>
        ) : (
          <SessaoConteudo
            sessaoId={sessao.id}
            emAndamento={emAndamento}
            exercicios={sessao.exercicios}
            exParam={exParam}
            removerSerieAction={removerSerieAction}
            concluirAction={concluirAction}
          />
        )}
      </Container>
    </main>
  );
}

async function SessaoConteudo({
  sessaoId,
  emAndamento,
  exercicios,
  exParam,
  removerSerieAction,
  concluirAction,
}: {
  sessaoId: string;
  emAndamento: boolean;
  exercicios: ExercicioDaSessao[];
  exParam?: string;
  removerSerieAction: (formData: FormData) => Promise<void>;
  concluirAction: (formData: FormData) => Promise<void>;
}) {
  // Exercício ativo: do ?ex= (por exercicioId); senão o primeiro sem série
  // registrada nesta sessão (reabrir leva onde parou); senão o primeiro.
  const porParam = exParam
    ? exercicios.findIndex((ex) => ex.exercicioId === exParam)
    : -1;
  const primeiroPendente = exercicios.findIndex((ex) => ex.series.length === 0);
  const ativoIndex =
    porParam >= 0 ? porParam : primeiroPendente >= 0 ? primeiroPendente : 0;

  const ativo = exercicios[ativoIndex];
  const anterior = ativoIndex > 0 ? exercicios[ativoIndex - 1] : null;
  const proximo =
    ativoIndex < exercicios.length - 1 ? exercicios[ativoIndex + 1] : null;

  // Só o exercício ativo consulta a "última vez" (menos consulta que o antigo
  // Promise.all de todos).
  const ultimaVez = await getUltimaVez(ativo.exercicioId, sessaoId);

  const navLink = (exercicioId: string) =>
    `/sessoes/${sessaoId}?ex=${exercicioId}`;

  return (
    <>
      <nav className="mt-6 flex items-center justify-between gap-2">
        {anterior ? (
          <Link
            href={navLink(anterior.exercicioId)}
            className={`${estilosBotao.base} ${estilosBotao.contorno}`}
          >
            ◀ Anterior
          </Link>
        ) : (
          <span className={`${estilosBotao.base} ${estilosBotao.contorno} pointer-events-none opacity-40`}>
            ◀ Anterior
          </span>
        )}
        <span className="text-rotulo text-texto-suave">
          {ativoIndex + 1} / {exercicios.length}
        </span>
        {proximo ? (
          <Link
            href={navLink(proximo.exercicioId)}
            className={`${estilosBotao.base} ${estilosBotao.contorno}`}
          >
            Próximo ▶
          </Link>
        ) : (
          <span className={`${estilosBotao.base} ${estilosBotao.contorno} pointer-events-none opacity-40`}>
            Próximo ▶
          </span>
        )}
      </nav>

      <Card variante="superficie" className="mt-4">
        <h2 className="text-secao font-semibold text-forte">{ativo.nome}</h2>
        <p className="text-rotulo text-texto-suave">{ativo.grupoMuscular}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{ativo.seriesAlvo} séries</Badge>
          <Badge>{faixaReps(ativo.repsAlvoMin, ativo.repsAlvoMax)} reps</Badge>
        </div>

        {ativo.series.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1">
            {ativo.series.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 text-corpo text-forte"
              >
                <span>
                  #{s.numero} — {s.carga}kg × {s.reps}
                </span>
                {emAndamento && (
                  <form action={removerSerieAction}>
                    <input type="hidden" name="serieId" value={s.id} />
                    <input type="hidden" name="sessaoId" value={sessaoId} />
                    <button
                      type="submit"
                      className="text-rotulo text-texto-suave transition-colors hover:text-red-600"
                    >
                      Remover
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        <Card variante="creme" className="mt-4">
          {ultimaVez ? (
            <>
              <Rotulo>
                ÚLTIMA VEZ ·{" "}
                {ultimaVez.data.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </Rotulo>
              <p className="mt-1 text-grande font-semibold text-forte">
                {ultimaVez.series
                  .map((s) => `${s.carga}kg × ${s.reps}`)
                  .join(" · ")}
              </p>
            </>
          ) : (
            <>
              <Rotulo>PRIMEIRA VEZ</Rotulo>
              <p className="mt-1 text-texto-suave">Sem registro anterior</p>
            </>
          )}
        </Card>

        {emAndamento && (
          <AnotarSerieForm sessaoId={sessaoId} exercicioId={ativo.exercicioId} />
        )}
      </Card>

      <div className="mt-8">
        <Rotulo>Todos os exercícios</Rotulo>
        <ul className="mt-2 flex flex-col gap-2">
          {exercicios.map((ex, i) => {
            const ativoItem = i === ativoIndex;
            const feito = ex.series.length > 0;
            return (
              <li key={ex.treinoExercicioId}>
                <Link
                  href={navLink(ex.exercicioId)}
                  className={`flex items-center justify-between gap-3 rounded-card border px-4 py-3 transition-colors ${
                    ativoItem
                      ? "border-primaria"
                      : "border-black/[.08] hover:bg-black/[.04]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-corpo text-forte">
                      {ex.nome}
                    </span>
                    <span className="block truncate text-rotulo text-texto-suave">
                      {ex.grupoMuscular}
                    </span>
                  </span>
                  {feito && <Badge variante="primaria">✓</Badge>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {emAndamento && (
        <form action={concluirAction} className="mt-8">
          <input type="hidden" name="sessaoId" value={sessaoId} />
          <Button type="submit">Concluir treino</Button>
        </form>
      )}
    </>
  );
}
