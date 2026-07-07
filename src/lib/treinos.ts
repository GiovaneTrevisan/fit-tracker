import { prisma } from "@/lib/prisma";

export interface TreinoResumo {
  id: string;
  nome: string;
  totalExercicios: number;
}

/**
 * Lista os treinos cadastrados, ordenados por criação (mais antigo primeiro),
 * com o nome e a contagem de exercícios de cada um.
 */
export async function getTreinos(): Promise<TreinoResumo[]> {
  const treinos = await prisma.treino.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { exercicios: true } } },
  });

  return treinos.map((t) => ({
    id: t.id,
    nome: t.nome,
    totalExercicios: t._count.exercicios,
  }));
}

export interface ExercicioDoTreino {
  treinoExercicioId: string;
  nome: string;
  grupoMuscular: string;
  seriesAlvo: number;
  repsAlvo: number;
}

export interface TreinoDetalhe {
  id: string;
  nome: string;
  exercicios: ExercicioDoTreino[];
}

/**
 * Busca um treino pelo id com seus exercícios (via TreinoExercicio → Exercicio),
 * ordenados por `ordem`. Retorna `null` se o treino não existir.
 */
export async function getTreino(id: string): Promise<TreinoDetalhe | null> {
  const treino = await prisma.treino.findUnique({
    where: { id },
    include: {
      exercicios: {
        orderBy: { ordem: "asc" },
        include: { exercicio: true },
      },
    },
  });

  if (!treino) return null;

  return {
    id: treino.id,
    nome: treino.nome,
    exercicios: treino.exercicios.map((te) => ({
      treinoExercicioId: te.id,
      nome: te.exercicio.nome,
      grupoMuscular: te.exercicio.grupoMuscular,
      seriesAlvo: te.seriesAlvo,
      repsAlvo: te.repsAlvo,
    })),
  };
}
