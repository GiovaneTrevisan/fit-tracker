"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/container";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/treinos", label: "Treinos" },
  { href: "/historico", label: "Histórico" },
] as const;

/**
 * Barra de navegação fixa no topo, presente em todas as páginas (renderizada no
 * layout). Client Component porque usa usePathname pra destacar o link ativo —
 * as páginas em si continuam Server Components.
 */
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-black/[.08] bg-white/80 backdrop-blur">
      <Container className="flex gap-1 py-2">
        {LINKS.map((link) => {
          const ativo =
            link.href === "/"
              ? pathname === "/"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={ativo ? "page" : undefined}
              className={
                ativo
                  ? "rounded-lg px-3 py-2.5 text-sm font-semibold text-black"
                  : "rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-black/[.04] hover:text-black"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </Container>
    </nav>
  );
}
