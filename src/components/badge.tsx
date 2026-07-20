import type { ComponentProps } from "react";

/**
 * Selo/chip em formato de pílula, no estilo micro-label (MAIÚSCULAS, pequeno e
 * espaçado). Server Component puro. Usado no selo do dia, nos chips de meta
 * ("3 SÉRIES") etc.
 *
 * Variantes:
 * - neutro:   cinza claro sobre superfície branca (padrão)
 * - escuro:   translúcido sobre fundo preto (ex.: "SEXTA" no card de treino)
 * - primaria: azul primário com texto claro
 */
const variantes = {
  neutro: "bg-black/[.06] text-texto-suave",
  escuro: "bg-white/20 text-white",
  primaria: "bg-primaria text-primaria-texto",
} as const;

export function Badge({
  variante = "neutro",
  className,
  ...props
}: ComponentProps<"span"> & { variante?: keyof typeof variantes }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide",
        variantes[variante],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
