-- DropForeignKey
ALTER TABLE "Sessao" DROP CONSTRAINT "Sessao_treinoId_fkey";

-- AlterTable
ALTER TABLE "Treino" ADD COLUMN "arquivado" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "Treino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
