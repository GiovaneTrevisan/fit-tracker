/**
 * Helpers puros de dia-da-semana (sem acesso a banco), pra poderem ser
 * importados tanto por Client Components quanto pelo servidor sem arrastar o
 * Prisma pro bundle do cliente.
 */

/**
 * Nomes dos dias da semana indexados pela convenção do domínio (0=Domingo …
 * 6=Sábado), a mesma do calendário. Reutilizado em selos, no select do form e
 * nas mensagens de erro das actions.
 */
export const NOMES_DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

/**
 * Normaliza/valida o valor cru de `diaSemana` vindo de um form: string vazia
 * (opção "Sem dia definido") vira `null`; senão precisa ser inteiro em [0,6].
 * Reutilizado pelas actions de criar e de editar o dia do treino.
 */
export function parseDiaSemana(
  raw: FormDataEntryValue | null,
): { ok: true; diaSemana: number | null } | { ok: false } {
  const s = String(raw ?? "").trim();
  if (s === "") return { ok: true, diaSemana: null };
  const n = Number(s);
  if (!Number.isInteger(n) || n < 0 || n > 6) return { ok: false };
  return { ok: true, diaSemana: n };
}
