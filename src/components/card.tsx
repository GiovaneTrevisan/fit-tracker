import type { ComponentProps } from "react";
import Image from "next/image";

/**
 * Container de superfície do redesign. Server Component puro (sem estado, sem
 * Prisma) — pode ser usado tanto por Server quanto por Client Components.
 *
 * Variantes:
 * - superficie: card branco com borda sutil (padrão)
 * - forte:      card preto (hero, card de treino)
 * - creme:      card creme (sequência/streak)
 *
 * Prop `imagem` (opcional): quando presente, desenha uma foto de fundo com
 * next/image + overlay gradiente preto por baixo do conteúdo, mantendo o texto
 * legível. `null`/ausente = fundo liso da variante (fallback, comportamento
 * original). O caminho vem da convenção de arquivo (ver lib/treino-imagem).
 */
const variantes = {
  superficie: "bg-superficie text-texto border border-black/[.08]",
  forte: "bg-forte text-white",
  creme: "bg-creme text-forte",
} as const;

export function Card({
  variante = "superficie",
  imagem,
  prioridade = false,
  className,
  children,
  ...props
}: ComponentProps<"div"> & {
  variante?: keyof typeof variantes;
  imagem?: string | null;
  prioridade?: boolean;
}) {
  const base = ["rounded-bloco p-6", variantes[variante]];

  if (imagem) {
    return (
      <div
        className={[...base, "relative overflow-hidden", className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        <Image
          src={imagem}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 720px"
          priority={prioridade}
          className="object-cover"
        />
        {/* overlay: mais forte embaixo/à esquerda (onde fica o texto) e leve à
            direita (onde só tem foto), pra a imagem aparecer sem perder o
            contraste do texto branco */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/40 to-black/20" />
        {/* conteúdo acima do overlay */}
        <div className="relative">{children}</div>
      </div>
    );
  }

  return (
    <div className={[...base, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}
