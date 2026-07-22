import { prisma } from "@/lib/prisma";
import type { StatusSessao } from "@prisma/client";

export interface SerieRegistradaResumo {
  id: string;
  numero: number;
  carga: number;
  reps: number;
}

interface ExercicioBase {
  exercicioId: string;
  nome: string;
  grupoMuscular: string;
  series: SerieRegistradaResumo[];
}

/**
 * Exercício de uma sessão. União discriminada por `avulso`:
 * - do plano (`avulso: false`): veio do TreinoExercicio, tem metas planejadas.
 * - avulso (`avulso: true`): entrou fora do plano (tem SerieRegistrada nesta
 *   sessão, mas não está no treino) — por isso NÃO tem seriesAlvo/repsAlvo. O
 *   tipo proíbe lê-los sem antes checar `avulso`, pra não inventar valores.
 */
export type ExercicioDaSessao =
  | (ExercicioBase & {
      avulso: false;
      treinoExercicioId: string;
      seriesAlvo: number;
      repsAlvoMin: number;
      repsAlvoMax: number;
    })
  | (ExercicioBase & { avulso: true });

export interface SessaoDetalhe {
  id: string;
  treinoId: string;
  data: Date;
  status: StatusSessao;
  treinoNome: string;
  exercicios: ExercicioDaSessao[];
}

/**
 * Busca uma sessão pelo id devolvendo a UNIÃO dos exercícios:
 * - os do treino (plano), via TreinoExercicio → Exercicio, ordenados por `ordem`;
 * - depois os avulsos: exercícios com SerieRegistrada nesta sessão que NÃO estão
 *   no plano (registrados fora do treino durante a execução).
 * Retorna `null` se a sessão não existir.
 */
export async function getSessao(id: string): Promise<SessaoDetalhe | null> {
  const sessao = await prisma.sessao.findUnique({
    where: { id },
    include: {
      treino: {
        include: {
          exercicios: {
            orderBy: { ordem: "asc" },
            include: { exercicio: true },
          },
        },
      },
      series: { orderBy: { numero: "asc" }, include: { exercicio: true } },
    },
  });

  if (!sessao) return null;

  const resumoSerie = (s: (typeof sessao.series)[number]): SerieRegistradaResumo => ({
    id: s.id,
    numero: s.numero,
    carga: Number(s.carga),
    reps: s.reps,
  });

  const planoIds = new Set(
    sessao.treino.exercicios.map((te) => te.exercicioId),
  );

  const doPlano: ExercicioDaSessao[] = sessao.treino.exercicios.map((te) => ({
    avulso: false,
    treinoExercicioId: te.id,
    exercicioId: te.exercicioId,
    nome: te.exercicio.nome,
    grupoMuscular: te.exercicio.grupoMuscular,
    seriesAlvo: te.seriesAlvo,
    repsAlvoMin: te.repsAlvoMin,
    repsAlvoMax: te.repsAlvoMax,
    series: sessao.series
      .filter((s) => s.exercicioId === te.exercicioId)
      .map(resumoSerie),
  }));

  // Avulsos: séries fora do plano, agrupadas por exercício preservando a ordem
  // de primeira aparição (as séries já vêm ordenadas por `numero`).
  const avulsos: Extract<ExercicioDaSessao, { avulso: true }>[] = [];
  const indicePorExercicio = new Map<string, number>();
  for (const s of sessao.series) {
    if (planoIds.has(s.exercicioId)) continue;
    let i = indicePorExercicio.get(s.exercicioId);
    if (i === undefined) {
      i = avulsos.length;
      indicePorExercicio.set(s.exercicioId, i);
      avulsos.push({
        avulso: true,
        exercicioId: s.exercicioId,
        nome: s.exercicio.nome,
        grupoMuscular: s.exercicio.grupoMuscular,
        series: [],
      });
    }
    avulsos[i].series.push(resumoSerie(s));
  }

  return {
    id: sessao.id,
    treinoId: sessao.treinoId,
    data: sessao.data,
    status: sessao.status,
    treinoNome: sessao.treino.nome,
    exercicios: [...doPlano, ...avulsos],
  };
}
