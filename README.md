# Fit Tracker

App pessoal de acompanhamento de treinos de academia. O foco é comparar cada treino
com a última vez que o mesmo exercício foi feito, para acompanhar a evolução de carga
e repetições ao longo do tempo.

Deploy: [URL do deploy]

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

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — servir o build de produção
- `npm run lint` — checagem de lint
- `npm run db:studio` — abrir o Prisma Studio para inspecionar o banco
