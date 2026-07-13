import { prisma } from "@/lib/prisma";

const TZ = "America/Sao_Paulo";

/**
 * Partes de calendário (ano/mês/dia) de um instante, no fuso America/Sao_Paulo.
 */
function partesSP(d: Date): { ano: number; mes: number; dia: number } {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const m: Record<string, number> = {};
  for (const part of p) {
    if (part.type !== "literal") m[part.type] = Number(part.value);
  }
  return { ano: m.year, mes: m.month, dia: m.day };
}

/**
 * Instante UTC correspondente ao 00:00 (SP) de (ano, mes 1-12, dia). À prova de
 * DST: mede o offset do fuso no instante e corrige o "chute" ingênuo em UTC.
 */
function inicioDoDiaSP(ano: number, mes: number, dia: number): Date {
  const naiveUTC = Date.UTC(ano, mes - 1, dia, 0, 0, 0);
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(naiveUTC));
  const m: Record<string, number> = {};
  for (const part of p) {
    if (part.type !== "literal") m[part.type] = Number(part.value);
  }
  // 'hour' pode vir como 24 à meia-noite em algumas engines → normaliza p/ 0.
  const hora = m.hour === 24 ? 0 : m.hour;
  const asUTC = Date.UTC(m.year, m.month - 1, m.day, hora, m.minute, m.second);
  const offset = asUTC - naiveUTC; // (parede SP - UTC), ~ -3h
  return new Date(naiveUTC - offset);
}

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

/**
 * Data de "hoje" no fuso America/Sao_Paulo — usada pra destacar o dia atual na
 * grade sem depender do fuso do servidor.
 */
export function hojeEmSP(): { ano: number; mes: number; dia: number } {
  return partesSP(new Date());
}
