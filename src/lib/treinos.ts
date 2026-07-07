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
