import { prisma } from "@/lib/prisma";
import type { StatusSessao } from "@prisma/client";

export interface ExercicioDaSessao {
  treinoExercicioId: string;
  nome: string;
  grupoMuscular: string;
  seriesAlvo: number;
  repsAlvoMin: number;
  repsAlvoMax: number;
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
      nome: te.exercicio.nome,
      grupoMuscular: te.exercicio.grupoMuscular,
      seriesAlvo: te.seriesAlvo,
      repsAlvoMin: te.repsAlvoMin,
      repsAlvoMax: te.repsAlvoMax,
    })),
  };
}
