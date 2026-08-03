/**
 * Entrada de CLI do seed de demonstração (`npm run db:seed`).
 *
 * A lógica toda vive em src/lib/seed-demo.ts, compartilhada com o cron diário da
 * Vercel (src/app/api/reseed). Aqui ficam só as duas coisas que são de CLI: a
 * trava SEED_DEMO e a impressão do resumo.
 *
 * NUNCA rodar contra produção: o seed APAGA TUDO antes de popular. A trava é a
 * env SEED_DEMO="true" — sem ela o script aborta sem tocar no banco.
 *
 * Rodar:  SEED_DEMO=true npx prisma db seed   (ver "Banco de demonstração" no README)
 */

import { seedDemo, descreverAlvo, ID_SESSAO_EXEMPLO } from "@/lib/seed-demo";

async function main() {
  // Antes da trava: é lendo o host que dá pra confirmar a olho que o .env não
  // está apontando pro banco errado.
  console.log(`\nBanco alvo: ${descreverAlvo()}`);

  if (process.env.SEED_DEMO !== "true") {
    throw new Error(
      "Este script APAGA TUDO antes de popular e só roda no banco de demo.\n" +
        "Confirme com SEED_DEMO=\"true\" no ambiente (ou no .env) se o banco acima é mesmo o de demonstração.",
    );
  }

  const r = await seedDemo();

  console.log("\nPronto:");
  console.log(`  ${r.treinos} treinos, ${r.exercicios} exercícios`);
  console.log(
    `  ${r.sessoesConcluidas} sessões concluídas (${r.semanas} semanas), ${r.series} séries`,
  );
  console.log(
    `  1 sessão EM_ANDAMENTO em "${r.sessaoExemplo.treino}" com ${r.sessaoExemplo.series} séries`,
  );
  console.log("\nCole no .env do ambiente de demo:");
  console.log(`  DEMO_SESSAO_ID="${ID_SESSAO_EXEMPLO}"\n`);
}

main().catch((erro) => {
  console.error(`\n${erro instanceof Error ? erro.message : erro}\n`);
  process.exit(1);
});
