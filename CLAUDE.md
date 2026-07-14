# FIT Tracker

App pessoal de acompanhamento de treinos de academia. Uso individual (single-user).
Objetivo central: registrar cada treino e comparar com a última vez que fiz o mesmo
exercício, pra acompanhar evolução de carga/reps.

## Stack
- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Prisma + Postgres (Neon)
- Deploy: Vercel

## Modelo de dados (o coração do projeto)
Separar o PLANO da EXECUÇÃO:
- Exercicio        — catálogo reutilizável (nome, grupo muscular)
- Treino           — coleção nomeada ("Superiores", "Inferiores")
- TreinoExercicio  — liga exercício ao treino + meta planejada (séries/reps alvo)
- Sessao           — uma execução datada de um treino (data, duração, status)
- SerieRegistrada  — cada série real de um exercício numa sessão (carga, reps)

Regra da "última vez": pra um exercício, buscar a Sessao mais recente anterior que o
inclua e mostrar as SerieRegistrada dela como referência.
Todas as estatísticas (streak, consistência, total de treinos) derivam de Sessao.

## Convenções
- Server Components por padrão; Client Components só quando precisar de interatividade
- Todo acesso ao banco via Prisma, nunca SQL cru
- Arquivos em kebab-case; componentes em PascalCase
- Módulos de acesso a dados em src/lib que importam Prisma são server-only: nunca
  importe deles a partir de um Client Component ("use client"), senão o bundler puxa
  o Prisma (pg) pro cliente e o build quebra. Constantes/tipos/helpers puros
  compartilhados entre Server e Client Components devem morar em módulos separados
  que NÃO importam Prisma (ex.: src/lib/dias-semana.ts)

## Regras de trabalho
- Faça mudanças mínimas; não refatore código não relacionado ao pedido
- Rode o type check depois de cada mudança de código
- Um commit por mudança lógica, não um commit gigante
- Quando houver dúvida entre duas abordagens, explique as duas e me deixe escolher
- Responda sempre em português

## Comandos
- `npm run dev`             — servidor de desenvolvimento
- `npm run build`           — build de produção
- `npx prisma studio`       — visualizar o banco
- `npx prisma migrate dev`  — criar/aplicar migração
