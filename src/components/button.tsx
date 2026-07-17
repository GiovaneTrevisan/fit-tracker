import type { ComponentProps } from "react";

/**
 * Botão em pílula do redesign. Server Component puro.
 *
 * Variantes:
 * - primaria: azul primário com texto claro (ex.: "Bora!")
 * - contorno: fundo transparente com borda (ex.: "Marcar como concluído")
 *
 * `estilosBotao` é exportado à parte pra que CTAs que precisam ser <Link> (e não
 * <button>) reutilizem exatamente as mesmas classes, sem duplicar o estilo.
 */
export const estilosBotao = {
  base: "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-rotulo font-semibold transition-colors",
  primaria: "bg-primaria text-primaria-texto hover:bg-primaria/90",
  contorno: "border border-black/[.12] text-texto hover:bg-black/[.04]",
} as const;

export function Button({
  variante = "primaria",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: "primaria" | "contorno" }) {
  return (
    <button
      className={[estilosBotao.base, estilosBotao[variante], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
