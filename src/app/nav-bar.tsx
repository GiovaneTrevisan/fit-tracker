"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <nav className="sticky top-0 z-10 border-b border-black/[.08] bg-white/80 backdrop-blur dark:border-white/[.145] dark:bg-black/80">
      <div className="mx-auto flex w-full max-w-3xl gap-1 px-6 py-3">
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
                  ? "rounded-lg px-3 py-1.5 text-sm font-semibold text-black dark:text-zinc-50"
                  : "rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-black/[.04] hover:text-black dark:text-zinc-400 dark:hover:bg-[#1a1a1a] dark:hover:text-zinc-50"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
