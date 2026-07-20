import type { ComponentProps } from "react";

/**
 * Estilos de "label" e "valor" do redesign — o par recorrente nos mockups: um
 * micro-rótulo em MAIÚSCULAS acima de um número/título forte. Server Components
 * puros.
 */

/**
 * Eyebrow / micro-rótulo (ex.: "TREINO DE HOJE"). Diferente do Badge: é texto
 * corrido, não uma pílula.
 *
 * Tons:
 * - claro:        cinza suave, pra eyebrow sobre fundo claro (padrão)
 * - sobre-escuro: azul de acento (primária), pra eyebrow sobre card preto
 */
const tonsRotulo = {
  claro: "text-texto-suave",
  "sobre-escuro": "text-primaria",
} as const;

export function Rotulo({
  tom = "claro",
  className,
  ...props
}: ComponentProps<"p"> & { tom?: keyof typeof tonsRotulo }) {
  return (
    <p
      className={[
        "text-micro font-semibold uppercase tracking-wide",
        tonsRotulo[tom],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

/** Número/título de destaque (ex.: o "15" do streak, os totais). */
export function Valor({
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      className={["text-titulo font-semibold text-forte", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
