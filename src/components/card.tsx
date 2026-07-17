import type { ComponentProps } from "react";

/**
 * Container de superfície do redesign. Server Component puro (sem estado, sem
 * Prisma) — pode ser usado tanto por Server quanto por Client Components.
 *
 * Variantes:
 * - superficie: card branco com borda sutil (padrão)
 * - forte:      card preto (hero, card de treino)
 * - creme:      card creme (sequência/streak)
 */
const variantes = {
  superficie: "bg-superficie text-texto border border-black/[.08]",
  forte: "bg-forte text-white",
  creme: "bg-creme text-forte",
} as const;

export function Card({
  variante = "superficie",
  className,
  ...props
}: ComponentProps<"div"> & { variante?: keyof typeof variantes }) {
  return (
    <div
      className={["rounded-bloco p-6", variantes[variante], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
