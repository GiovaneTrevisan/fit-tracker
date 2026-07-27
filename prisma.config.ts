import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Seed do banco de DEMONSTRAÇÃO — apaga tudo e repopula. Protegido pela env
    // SEED_DEMO="true"; ver prisma/seed.ts.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
