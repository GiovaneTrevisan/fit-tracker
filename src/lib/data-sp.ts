/**
 * Helpers puros de data no fuso America/Sao_Paulo (sem acesso a banco). O runtime
 * da Vercel roda em UTC: todo dia-calendário do domínio é derivado aqui via Intl,
 * nunca de `getDate()`/`getDay()` crus.
 */

export const TZ = "America/Sao_Paulo";

/**
 * Partes de calendário (ano/mês/dia) de um instante, no fuso America/Sao_Paulo.
 */
export function partesSP(d: Date): { ano: number; mes: number; dia: number } {
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
export function inicioDoDiaSP(ano: number, mes: number, dia: number): Date {
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

/**
 * Data de "hoje" no fuso America/Sao_Paulo — usada pra destacar o dia atual na
 * grade sem depender do fuso do servidor.
 */
export function hojeEmSP(): { ano: number; mes: number; dia: number } {
  return partesSP(new Date());
}

/** Chave estável de dia-calendário SP ("2026-07-16"), pra comparar sem Date. */
export function chaveDia(p: { ano: number; mes: number; dia: number }): string {
  return `${p.ano}-${String(p.mes).padStart(2, "0")}-${String(p.dia).padStart(2, "0")}`;
}
