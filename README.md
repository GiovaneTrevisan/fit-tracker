# Fit Tracker

App pessoal de acompanhamento de treinos de academia. O foco é comparar cada treino
com a última vez que o mesmo exercício foi feito, para acompanhar a evolução de carga
e repetições ao longo do tempo.

Deploy: https://fit-tracker-demo.vercel.app/

## Funcionalidades

- **Treinos por dia da semana** — montar templates nomeados ("Superiores",
  "Inferiores") com exercícios e metas planejadas (séries e faixa de repetições), cada
  um associado a um dia fixo da semana ou avulso.
- **Sessões com séries** — iniciar a execução datada de um treino e registrar cada
  série real com carga e repetições.
- **Regra da "última vez"** — ao registrar um exercício, o app mostra as séries da
  sessão concluída mais recente que o incluiu (busca global, entre quaisquer treinos),
  servindo de referência para superar a marca anterior.
- **Histórico em calendário** — visão mensal das sessões concluídas, navegável por mês.
- **Estatísticas** — sequência atual (streak) de treinos agendados cumpridos, total de
  treinos realizados e heatmap anual de consistência.
- **Arquivar treino** — retirar um template de circulação sem apagar o histórico de
  sessões que dependem dele.
- **PWA instalável** — manifest e ícones para instalar como app (modo standalone).

## Stack técnica

- **Next.js 16** (App Router) com Server Components por padrão
- **TypeScript** (strict)
- **Prisma 7** sobre **Postgres** (Neon), via adaptador `@prisma/adapter-pg`
- **Tailwind CSS v4**
- Deploy na **Vercel**

## Decisões de arquitetura

- **Separação entre plano e execução.** O template (`Treino` + `TreinoExercicio`, com as
  metas planejadas) é modelado separadamente da execução (`Sessao` + `SerieRegistrada`,
  o que foi feito de fato). Isso permite refazer o mesmo treino muitas vezes mantendo um
  histórico independente e comparável, sem duplicar o catálogo de exercícios.

- **Migrações que preservam dados.** A evolução do schema (adicionar dia da semana,
  arquivamento, faixa de repetições) é feita por migrações não-destrutivas — colunas
  adicionadas sem descartar sessões já registradas.

- **Fuso horário em ambiente serverless.** O runtime da Vercel roda em UTC, mas todo
  dia-calendário do domínio (streak, heatmap, "hoje") é derivado no fuso
  `America/Sao_Paulo` via `Intl`, nunca a partir do fuso do servidor. O cálculo do
  streak caminha dia a dia com aritmética de datas imune a horário de verão.

## Como rodar localmente

Pré-requisitos:

- Node.js 20+
- Um banco Postgres (o projeto usa Neon; qualquer Postgres serve)

Passos:

```bash
# 1. Instalar dependências
npm install

# 2. Configurar as variáveis de ambiente
cp .env.example .env
# edite .env e preencha DATABASE_URL (conexão pooled) e DIRECT_URL (conexão direta,
# usada pelas migrações)

# 3. Aplicar as migrações do banco
npx prisma migrate dev

# 4. Subir o servidor de desenvolvimento
npm run dev
```

O app fica disponível em `http://localhost:3000`.

## Banco de demonstração

O deploy público de portfólio roda sobre um banco descartável populado por
`prisma/seed.ts`: 4 treinos numa rotina de 4 dias, catálogo de exercícios reais, ~6
meses de sessões concluídas com progressão de carga (incluindo uma semana de férias e
faltas esparsas, pro heatmap não parecer sintético) e uma sessão `EM_ANDAMENTO` de
exemplo com id fixo `demo-sessao-exemplo`, pra onde `DEMO_SESSAO_ID` aponta.

> **O seed APAGA TUDO antes de popular.** A trava é a env `SEED_DEMO="true"` — sem ela
> o script aborta sem tocar no banco. Nunca defina essa variável em produção.

Para (re)popular, confirme que o `.env` aponta para o banco de demonstração — o script
imprime o host e o database antes de qualquer escrita — e rode:

```bash
# opção 1: descomentar SEED_DEMO="true" no .env
npm run db:seed

# opção 2: só nesta execução (bash)
SEED_DEMO=true npm run db:seed

# opção 2: só nesta execução (PowerShell)
$env:SEED_DEMO="true"; npm run db:seed
```

É idempotente no sentido que importa: pode rodar quantas vezes quiser, e rodar duas
vezes no mesmo dia produz o mesmo banco (a aleatoriedade vem de um PRNG com semente
fixa). O `DEMO_SESSAO_ID` não muda entre re-seeds.

**Re-seede a cada ~3 dias** para manter a demo apresentável. O histórico é estático
mas o app é ancorado em "hoje": o streak quebra no primeiro dia agendado que passa sem
sessão concluída, e não há como gerar sessão no futuro. O seed compensa alinhando a
escala de treinos ao dia em que roda, o que segura o streak por 4 dias (o dia do seed
e mais três) — depois disso ele zera. Os detalhes estão no cabeçalho de
`prisma/seed.ts`.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — servir o build de produção
- `npm run lint` — checagem de lint
- `npm run db:studio` — abrir o Prisma Studio para inspecionar o banco
- `npm run db:seed` — repopular o banco de demonstração (destrutivo; exige `SEED_DEMO`)
