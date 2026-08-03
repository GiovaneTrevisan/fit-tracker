/**
 * Re-seed automático do banco de demonstração, chamado pelo Vercel Cron uma vez
 * por dia (agendamento em vercel.json).
 *
 * A demo envelhece sozinha: o histórico é estático e o app é ancorado em "hoje",
 * então o streak zera ~4 dias depois do seed. Este endpoint é o que mantém a demo
 * fresca sem re-seed manual — a lógica é a MESMA de `npm run db:seed`, importada
 * de src/lib/seed-demo.ts.
 *
 * O seed APAGA TUDO antes de popular, então são três camadas antes de qualquer
 * acesso ao banco — e nenhuma delas é opcional:
 *
 *   1. MODO_DEMO="true" (isModoDemo). Fora do deploy de demonstração a rota
 *      simplesmente não existe: 404, sem revelar que ela existe em outro lugar.
 *   2. Authorization: Bearer $CRON_SECRET, que é o header que a Vercel injeta nos
 *      cron jobs. Sem CRON_SECRET no ambiente, nada passa — a ausência nunca vira
 *      um "match" com header vazio.
 *   3. O banco é o do próprio ambiente (DIRECT_URL/DATABASE_URL do deploy demo).
 *      A rota não lê query param nem body: não há como apontá-la pra outro banco.
 */

import { timingSafeEqual } from "node:crypto";
import { isModoDemo } from "@/lib/demo";
import { descreverAlvo, seedDemo } from "@/lib/seed-demo";

export const runtime = "nodejs"; // Prisma + pg não rodam no edge
export const dynamic = "force-dynamic"; // nunca cachear: é uma escrita
export const maxDuration = 60; // teto do plano Hobby; o seed leva segundos

/**
 * Comparação em tempo constante. `timingSafeEqual` exige buffers do mesmo
 * tamanho (lança, senão), daí a checagem de comprimento antes — ela vaza só o
 * tamanho do segredo, não o conteúdo.
 */
function segredoConfere(recebido: string, esperado: string): boolean {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  // Camada 1 — ambiente.
  if (!isModoDemo()) {
    return Response.json({ erro: "Não encontrado" }, { status: 404 });
  }

  // Camada 2 — chamador.
  const segredo = process.env.CRON_SECRET;
  const autorizacao = request.headers.get("authorization");
  if (
    !segredo ||
    !autorizacao ||
    !segredoConfere(autorizacao, `Bearer ${segredo}`)
  ) {
    return Response.json({ erro: "Não autorizado" }, { status: 401 });
  }

  // Camada 3 — banco: o do ambiente, sem parâmetro nenhum vindo da requisição.
  console.log(`[reseed] Banco alvo: ${descreverAlvo()}`);

  try {
    const resultado = await seedDemo();
    console.log(`[reseed] Concluído em ${resultado.duracaoMs}ms`);
    return Response.json({ ok: true, ...resultado });
  } catch (erro) {
    console.error("[reseed] Falhou:", erro);
    return Response.json(
      { ok: false, erro: erro instanceof Error ? erro.message : String(erro) },
      { status: 500 },
    );
  }
}
