/**
 * Escala de intensidade da consistência — fonte de verdade única, compartilhada
 * entre o heatmap da Início e o calendário do Histórico. Módulo puro (sem Prisma),
 * seguro para Server e Client Components.
 */

// Intensidade → token de cor. 0 treinos = neutro; 1→consist-1, 2→consist-2,
// 3+→consist-4 (o consist-3 fica reservado pra manter o salto de contraste).
const TONS = [
  "bg-black/[.06]", // 0
  "bg-consistencia-1", // 1
  "bg-consistencia-2", // 2
  "bg-consistencia-4", // 3+
] as const;

export function tomConsistencia(qtd: number): string {
  return TONS[Math.min(qtd, TONS.length - 1)];
}
