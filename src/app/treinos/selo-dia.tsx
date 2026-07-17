import { NOMES_DIAS } from "@/lib/dias-semana";
import { Badge } from "@/components/badge";

/**
 * Selo com o dia da semana do treino (ex.: "SEGUNDA"). Não renderiza nada para
 * treinos avulsos (diaSemana null). Usa a primitiva Badge do redesign.
 */
export function SeloDia({ diaSemana }: { diaSemana: number | null }) {
  if (diaSemana === null) return null;

  return <Badge>{NOMES_DIAS[diaSemana]}</Badge>;
}
