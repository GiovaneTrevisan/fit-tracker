import type { ComponentProps } from "react";

/**
 * Container base do app: largura total no mobile com padding lateral confortável,
 * centralizado e limitado a max-w-3xl no desktop. Server Component puro (só layout,
 * sem cor, sem estado) — as telas o reusam em vez de repetir estas classes.
 *
 * O espaçamento vertical fica com a tela (ex.: `<main className="py-12">`), não aqui.
 */
export function Container({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={["mx-auto w-full max-w-3xl px-6", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
