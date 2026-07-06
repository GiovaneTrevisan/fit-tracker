-- CreateEnum
CREATE TYPE "StatusSessao" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Exercicio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "grupoMuscular" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treino" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreinoExercicio" (
    "id" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "exercicioId" TEXT NOT NULL,
    "seriesAlvo" INTEGER NOT NULL,
    "repsAlvo" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TreinoExercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duracaoMin" INTEGER,
    "status" "StatusSessao" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerieRegistrada" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "exercicioId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "carga" DECIMAL(6,2) NOT NULL,
    "reps" INTEGER NOT NULL,

    CONSTRAINT "SerieRegistrada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TreinoExercicio_exercicioId_idx" ON "TreinoExercicio"("exercicioId");

-- CreateIndex
CREATE UNIQUE INDEX "TreinoExercicio_treinoId_exercicioId_key" ON "TreinoExercicio"("treinoId", "exercicioId");

-- CreateIndex
CREATE INDEX "Sessao_treinoId_data_idx" ON "Sessao"("treinoId", "data");

-- CreateIndex
CREATE INDEX "SerieRegistrada_exercicioId_idx" ON "SerieRegistrada"("exercicioId");

-- CreateIndex
CREATE INDEX "SerieRegistrada_sessaoId_idx" ON "SerieRegistrada"("sessaoId");

-- AddForeignKey
ALTER TABLE "TreinoExercicio" ADD CONSTRAINT "TreinoExercicio_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "Treino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreinoExercicio" ADD CONSTRAINT "TreinoExercicio_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "Exercicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "Treino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerieRegistrada" ADD CONSTRAINT "SerieRegistrada_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "Sessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerieRegistrada" ADD CONSTRAINT "SerieRegistrada_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "Exercicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
