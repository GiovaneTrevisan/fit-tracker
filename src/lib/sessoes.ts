import { prisma } from "@/lib/prisma";
import type { StatusSessao } from "@prisma/client";

export interface SerieRegistradaResumo {
  id: string;
  numero: number;
  carga: number;
  reps: number;
}

export interface ExercicioDaSessao {
  treinoExercicioId: string;
  exercicioId: string;
  nome: string;
  grupoMuscular: string;
  seriesAlvo: number;
  repsAlvoMin: number;
  repsAlvoMax: number;
  series: SerieRegistradaResumo[];
}

export interface SessaoDetalhe {
  id: string;
  treinoId: string;
  data: Date;
  status: StatusSessao;
  treinoNome: string;
  exercicios: ExercicioDaSessao[];
}

/**
 * Busca uma sessão pelo id com o treino e os exercícios do treino
 * (via TreinoExercicio → Exercicio), ordenados por `ordem`. Retorna `null` se
 * a sessão não existir.
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
      series: { orderBy: { numero: "asc" } },
    },
  });

  if (!sessao) return null;

  return {
    id: sessao.id,
    treinoId: sessao.treinoId,
    data: sessao.data,
    status: sessao.status,
    treinoNome: sessao.treino.nome,
    exercicios: sessao.treino.exercicios.map((te) => ({
      treinoExercicioId: te.id,
      exercicioId: te.exercicioId,
      nome: te.exercicio.nome,
      grupoMuscular: te.exercicio.grupoMuscular,
      seriesAlvo: te.seriesAlvo,
      repsAlvoMin: te.repsAlvoMin,
      repsAlvoMax: te.repsAlvoMax,
      series: sessao.series
        .filter((s) => s.exercicioId === te.exercicioId)
        .map((s) => ({
          id: s.id,
          numero: s.numero,
          carga: Number(s.carga),
          reps: s.reps,
        })),
    })),
  };
}
