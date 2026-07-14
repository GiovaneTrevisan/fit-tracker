-- AlterTable
ALTER TABLE "Treino" ADD COLUMN "diaSemana" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Treino_diaSemana_key" ON "Treino"("diaSemana");
