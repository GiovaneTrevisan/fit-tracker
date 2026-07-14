import { NOMES_DIAS } from "@/lib/treinos";

/**
 * Selo com o dia da semana do treino (ex.: "SEGUNDA"). Não renderiza nada para
 * treinos avulsos (diaSemana null).
 */
export function SeloDia({ diaSemana }: { diaSemana: number | null }) {
  if (diaSemana === null) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-black/[.06] px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-700 dark:bg-white/[.10] dark:text-zinc-300">
      {NOMES_DIAS[diaSemana]}
    </span>
  );
}
