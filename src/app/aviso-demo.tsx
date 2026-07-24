import { isModoDemo, TEXTO_MODO_DEMO } from "@/lib/demo";

/**
 * Faixa fina no topo avisando que o app está só-leitura. Server Component: lê a
 * env direto e some por completo (render null) fora do modo demo, deixando o
 * layout idêntico ao normal. Fica no fluxo, acima da NavBar sticky.
 */
export function AvisoDemo() {
  if (!isModoDemo()) return null;

  return (
    <div className="border-b border-black/[.08] bg-creme px-4 py-1.5 text-center text-micro font-semibold text-forte">
      {TEXTO_MODO_DEMO}
    </div>
  );
}
