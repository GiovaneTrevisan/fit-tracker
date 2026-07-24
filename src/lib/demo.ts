/**
 * Modo demonstração: interruptor de só-leitura por ambiente, pra um deploy
 * público navegável sem risco de escrita. Módulo puro (sem Prisma), como
 * `dias-semana.ts`, pra poder ser importado por qualquer camada do servidor.
 */

/** Texto único do aviso, reutilizado na faixa do topo e nos erros das actions. */
export const TEXTO_MODO_DEMO = "Modo demonstração — somente leitura";

/**
 * Só `MODO_DEMO="true"` ativa o modo; ausência ou qualquer outro valor mantém o
 * comportamento normal. Chame apenas no servidor: `process.env` não chega ao
 * cliente sem o prefixo NEXT_PUBLIC_.
 */
export function isModoDemo(): boolean {
  return process.env.MODO_DEMO === "true";
}
