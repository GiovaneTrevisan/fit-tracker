import { prisma } from "@/lib/prisma";

export interface SerieAnterior {
  numero: number;
  carga: number;
  reps: number;
}

export interface UltimaVez {
  data: Date;
  series: SerieAnterior[];
}

/**
 * Regra da "última vez": dado um exercício, retorna o desempenho anterior — as séries
 * registradas na Sessao CONCLUIDA mais recente (por data) que o incluiu.
 *
 * Global: não filtra por treino. Exclui `sessaoAtualId` quando fornecido.
 * Retorna `null` se o exercício nunca foi feito antes.
 */
export async function getUltimaVez(
  exercicioId: string,
  sessaoAtualId?: string,
): Promise<UltimaVez | null> {
  const sessao = await prisma.sessao.findFirst({
    where: {
      status: "CONCLUIDA",
      series: { some: { exercicioId } },
      ...(sessaoAtualId ? { id: { not: sessaoAtualId } } : {}),
    },
    orderBy: [{ data: "desc" }, { createdAt: "desc" }],
    include: {
      series: {
        where: { exercicioId },
        orderBy: { numero: "asc" },
      },
    },
  });

  if (!sessao) return null;

  return {
    data: sessao.data,
    series: sessao.series.map((s) => ({
      numero: s.numero,
      carga: Number(s.carga),
      reps: s.reps,
    })),
  };
}
