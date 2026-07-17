import type { ComponentProps } from "react";

/**
 * Estilos de "label" e "valor" do redesign — o par recorrente nos mockups: um
 * micro-rótulo em MAIÚSCULAS acima de um número/título forte. Server Components
 * puros.
 */

/**
 * Eyebrow / micro-rótulo (ex.: "TREINO DE HOJE"). Diferente do Badge: é texto
 * corrido, não uma pílula.
 */
export function Rotulo({
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      className={[
        "text-micro font-semibold uppercase tracking-wide text-texto-suave",
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
