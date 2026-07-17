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

## Design (Figma)
O arquivo "FIT.AI - Alunos - Copy" é referência de LINGUAGEM VISUAL apenas: cores,
tipografia, espaçamento, estilo de componentes. Não é o escopo do app.

Ele contém telas de funcionalidades que este app NÃO tem (chat de IA, etc.). Nunca
implemente uma tela ou feature só porque ela existe no Figma — a existência de um
design não é um pedido. Se algo do Figma parecer útil, me pergunte antes.

As telas do app são estas, e só estas:
- Início — `/`
- Treinos — `/treinos` e `/treinos/[id]`
- Sessão — `/sessoes/[id]`
- Histórico — `/historico`

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
- Quando houver dúvida entre duas abordagens, explique as duas e me deixe escolher
- Responda sempre em português

## Fluxo de git
- Uma branch por feature; commits pequenos e lógicos.
- Nunca faça push nem abra PR por conta própria. Ao terminar de implementar e rodar o
  type check, pare e me avise: eu valido no navegador primeiro. Só faça o push e me passe
  o link do PR quando eu pedir explicitamente ("abra o PR").
- O `gh` não está instalado e não há token de API. Para abrir PR: faça o push e me passe
  o link `https://github.com/GiovaneTrevisan/fit-tracker/pull/new/<branch>` com sugestão
  de título e descrição. Eu abro e mergeio pela web — nunca faça merge.
- Depois que eu confirmar o merge, a limpeza é sempre: `git checkout main` → `git pull`
  (traz o merge do remoto) → apagar a branch local → apagar a remota se ainda existir.
  O `git pull` antes de tudo é obrigatório: sem ele a main local fica desatualizada e a
  próxima branch nasce sem a feature recém-integrada.

## Comandos
- `npm run dev`             — servidor de desenvolvimento
- `npm run build`           — build de produção
- `npx prisma studio`       — visualizar o banco
- `npx prisma migrate dev`  — criar/aplicar migração
