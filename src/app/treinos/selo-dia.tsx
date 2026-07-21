import { ComponentProps } from "react";
import { NOMES_DIAS } from "@/lib/dias-semana";
import { Badge } from "@/components/badge";

/**
 * Selo com o dia da semana do treino (ex.: "SEGUNDA"). Não renderiza nada para
 * treinos avulsos (diaSemana null). Usa a primitiva Badge do redesign.
 *
 * `variante` repassa pro Badge: padrão claro (`neutro`) sobre superfície clara;
 * `escuro` quando o selo fica sobre um card preto/foto.
 */
export function SeloDia({
  diaSemana,
  variante,
}: {
  diaSemana: number | null;
  variante?: ComponentProps<typeof Badge>["variante"];
}) {
  if (diaSemana === null) return null;

  return <Badge variante={variante}>{NOMES_DIAS[diaSemana]}</Badge>;
}
