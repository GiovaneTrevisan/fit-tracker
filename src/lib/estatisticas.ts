import { chaveDia, hojeEmSP, inicioDoDiaSP, partesSP } from "@/lib/data-sp";
import { prisma } from "@/lib/prisma";

const DIA_MS = 86_400_000;

/** Até onde o streak retrocede — limite de segurança pra caminhada dia a dia. */
const LIMITE_DIAS = 365;

/**
 * Total de treinos feitos: contagem de todas as sessões CONCLUIDA, sem recorte
 * de período.
 */
export async function getTotalTreinos(): Promise<number> {
  return prisma.sessao.count({ where: { status: "CONCLUIDA" } });
}

/**
 * Sequência atual de treinos agendados cumpridos. Caminha de hoje (SP) pra trás:
 * dia sem treino agendado é pulado (não conta nem quebra), dia agendado com
 * sessão concluída soma +1, dia agendado sem sessão quebra. Exceção: se hoje é
 * dia agendado e ainda não treinei, a sequência não morre — só morre quando o
 * dia passa. Sem nenhum treino com dia definido, retorna 0.
 */
export async function getStreak(): Promise<number> {
  const treinos = await prisma.treino.findMany({
    where: { arquivado: false, diaSemana: { not: null } },
    select: { diaSemana: true },
  });
  const diasAgendados = new Set(treinos.map((t) => t.diaSemana as number));
  if (diasAgendados.size === 0) return 0;

  const hoje = hojeEmSP();
  const ancoraHoje = Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia);

  // Uma query só pro período todo; a caminhada consulta o Set, nunca o banco.
  const limite = new Date(ancoraHoje - (LIMITE_DIAS - 1) * DIA_MS);
  const inicio = inicioDoDiaSP(
    limite.getUTCFullYear(),
    limite.getUTCMonth() + 1,
    limite.getUTCDate(),
  );
  const sessoes = await prisma.sessao.findMany({
    where: { status: "CONCLUIDA", data: { gte: inicio } },
    select: { data: true },
  });
  const diasComTreino = new Set(sessoes.map((s) => chaveDia(partesSP(s.data))));

  let streak = 0;
  for (let i = 0; i < LIMITE_DIAS; i++) {
    // Âncora é meia-noite UTC de uma data-calendário SP: aritmética de dia pura,
    // imune a DST.
    const cursor = new Date(ancoraHoje - i * DIA_MS);
    if (!diasAgendados.has(cursor.getUTCDay())) continue; // dia livre: pula

    const chave = chaveDia({
      ano: cursor.getUTCFullYear(),
      mes: cursor.getUTCMonth() + 1,
      dia: cursor.getUTCDate(),
    });
    if (diasComTreino.has(chave)) {
      streak++;
    } else if (i > 0) {
      break; // dia agendado que já passou sem treino: quebra
    }
  }
  return streak;
}

/**
 * Sessões CONCLUIDA do ano (jan→dez, fuso SP) agrupadas por dia-calendário:
 * Map chaveDia → quantidade de sessões. Alimenta o heatmap de consistência.
 */
export async function getHeatmapAno(ano: number): Promise<Map<string, number>> {
  const inicio = inicioDoDiaSP(ano, 1, 1);
  const fim = inicioDoDiaSP(ano + 1, 1, 1); // exclusivo

  const sessoes = await prisma.sessao.findMany({
    where: { status: "CONCLUIDA", data: { gte: inicio, lt: fim } },
    select: { data: true },
  });

  const porDia = new Map<string, number>();
  for (const s of sessoes) {
    const chave = chaveDia(partesSP(s.data));
    porDia.set(chave, (porDia.get(chave) ?? 0) + 1);
  }
  return porDia;
}
