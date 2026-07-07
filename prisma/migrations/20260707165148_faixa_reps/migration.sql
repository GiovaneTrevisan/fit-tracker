-- Adiciona as colunas novas como nullable (pra poder popular antes do NOT NULL)
ALTER TABLE "TreinoExercicio" ADD COLUMN "repsAlvoMin" INTEGER;
ALTER TABLE "TreinoExercicio" ADD COLUMN "repsAlvoMax" INTEGER;

-- Backfill: copia o valor único antigo para min e max em todas as linhas
UPDATE "TreinoExercicio" SET "repsAlvoMin" = "repsAlvo", "repsAlvoMax" = "repsAlvo";

-- Agora que estão populadas, aplica NOT NULL
ALTER TABLE "TreinoExercicio" ALTER COLUMN "repsAlvoMin" SET NOT NULL;
ALTER TABLE "TreinoExercicio" ALTER COLUMN "repsAlvoMax" SET NOT NULL;

-- Remove a coluna antiga
ALTER TABLE "TreinoExercicio" DROP COLUMN "repsAlvo";
