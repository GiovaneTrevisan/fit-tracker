import { inicioDoDiaSP, partesSP } from "@/lib/data-sp";
import { prisma } from "@/lib/prisma";

export interface SessaoDoDia {
  id: string;
  data: Date;
  treinoNome: string;
  treinoId: string;
}

/**
 * Sessões CONCLUIDA de um mês (ano, mes 1-12) no fuso America/Sao_Paulo,
 * agrupadas por dia-calendário SP. Retorna um Map dia(1-31) → lista de sessões
 * (um dia pode ter várias).
 */
export async function getSessoesDoMes(
  ano: number,
  mes: number,
): Promise<Map<number, SessaoDoDia[]>> {
  const inicio = inicioDoDiaSP(ano, mes, 1); // 00:00 SP do 1º dia (instante UTC)
  const fim = inicioDoDiaSP(
    mes === 12 ? ano + 1 : ano,
    mes === 12 ? 1 : mes + 1,
    1,
  ); // 1º dia do mês seguinte (exclusivo)

  const sessoes = await prisma.sessao.findMany({
    where: { status: "CONCLUIDA", data: { gte: inicio, lt: fim } },
    orderBy: { data: "asc" },
    include: { treino: { select: { nome: true } } },
  });

  const porDia = new Map<number, SessaoDoDia[]>();
  for (const s of sessoes) {
    const dia = partesSP(s.data).dia; // dia-calendário no fuso SP
    const lista = porDia.get(dia) ?? [];
    lista.push({
      id: s.id,
      data: s.data,
      treinoNome: s.treino.nome,
      treinoId: s.treinoId,
    });
    porDia.set(dia, lista);
  }
  return porDia;
}
