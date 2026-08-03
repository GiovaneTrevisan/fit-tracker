/**
 * Seed do banco de DEMONSTRAÇÃO — a lógica, sem entrada.
 *
 * Popula um banco descartável com ~6 meses de histórico fictício (mas plausível)
 * pro deploy público de portfólio: 4 treinos com dia da semana, catálogo de
 * exercícios reais, sessões concluídas com progressão de carga e uma sessão
 * EM_ANDAMENTO fixa pra onde o DEMO_SESSAO_ID aponta.
 *
 * A sessão de exemplo fica no treino MAIS ANTIGO da escala, não no de hoje: é o
 * que faz a "última vez" de cada exercício dela apontar pra dias atrás, com carga
 * menor. No treino de hoje ela competiria com a concluída do próprio dia e a tela
 * viraria uma comparação com hoje mesmo — que é justo o oposto da ideia.
 *
 * `seedDemo()` APAGA TUDO antes de popular e NÃO tem trava própria: a proteção é
 * responsabilidade de quem chama, e existem dois chamadores.
 *   - prisma/seed.ts     — CLI (`npm run db:seed`), travado por SEED_DEMO="true"
 *   - src/app/api/reseed — cron diário da Vercel, travado por MODO_DEMO + CRON_SECRET
 *
 * Módulo server-only: importa o Prisma. Nunca importar de um Client Component.
 *
 * ---------------------------------------------------------------------------
 * Por que a escala é RELATIVA ao dia em que o seed roda
 * ---------------------------------------------------------------------------
 * O banco é estático, mas o app é ancorado em "hoje" — então a demo envelhece.
 * Quem sofre é o streak: getStreak (src/lib/estatisticas.ts) caminha de hoje pra
 * trás e quebra no primeiro dia agendado sem sessão concluída, perdoando só o
 * próprio dia de hoje. Rodado o seed no dia D e aberta a demo no dia T, o streak
 * só sobrevive se NENHUM dia agendado cair em {D+1, …, T-1}.
 *
 * Como não dá pra gerar sessão no futuro, a única alavanca é quais dias da semana
 * são agendados — e é este script que cria os treinos. Daí ESCALA (abaixo) ser
 * uma lista de offsets em vez de dias fixos: o bloco de treinos termina sempre no
 * dia do seed, deixando D+1 e D+2 livres. O streak fica cheio em D, D+1, D+2 e
 * D+3, e só zera em D+4 — ou seja, a demo aguenta ~3 dias sem re-seed.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hojeEmSP, inicioDoDiaSP } from "@/lib/data-sp";

const DIA_MS = 86_400_000;

/** Quantas semanas de histórico gerar (26 ≈ 6 meses). */
const SEMANAS = 26;

/** Semana (0-based) em que "viajei": nenhum treino, pra o heatmap ter um buraco. */
const SEMANA_FERIAS = 11;

/**
 * Nos últimos N dias agendados não há faltas — é o que sustenta o streak da tela
 * inicial. Contado em dias agendados, não em semanas: é essa a unidade que o
 * getStreak percorre.
 */
const DIAS_AGENDADOS_SEM_FALTA = 12;

/** Chance de faltar num dia de treino isolado, fora da janela protegida. */
const CHANCE_FALTA = 0.12;

/** Id fixo da sessão de exemplo: o DEMO_SESSAO_ID não muda entre re-seeds. */
export const ID_SESSAO_EXEMPLO = "demo-sessao-exemplo";

/** Semente do PRNG: fixa, pra todo re-seed produzir o mesmo histórico. */
const SEMENTE = 20260727;

// ---------------------------------------------------------------------------
// Aleatoriedade determinística
// ---------------------------------------------------------------------------

/**
 * PRNG com semente fixa (mulberry32). Math.random() faria cada re-seed gerar um
 * banco diferente; aqui a mesma semente sempre produz exatamente o mesmo
 * histórico, o que combina com a limpeza total e torna a demo reprodutível.
 */
function criarRng(semente: number): () => number {
  let a = semente;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Reatribuído no início de cada `seedDemo()`, e não só uma vez no módulo: numa
 * lambda quente (o cron) a segunda chamada continuaria de onde a primeira parou e
 * a demo deixaria de ser reprodutível.
 */
let rng = criarRng(SEMENTE);

/** Inteiro em [min, max], inclusivo nos dois lados. */
function inteiroEntre(min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// ---------------------------------------------------------------------------
// Catálogo de exercícios
// ---------------------------------------------------------------------------

interface DefExercicio {
  nome: string;
  grupoMuscular: string;
  seriesAlvo: number;
  repsAlvoMin: number;
  repsAlvoMax: number;
  /** Carga (kg) na primeira semana do histórico. */
  cargaInicial: number;
  /** Quanto a carga sobe a cada bloco de progressão (kg). */
  incremento: number;
  /** De quantas em quantas semanas a carga sobe um incremento. */
  semanasPorBloco: number;
}

/**
 * Catálogo único — cada exercício existe uma vez só e é referenciado pelo nome
 * nos treinos. `Exercicio.nome` não é unique no schema, então a deduplicação é
 * responsabilidade daqui (o app faz o mesmo, na aplicação).
 */
const CATALOGO: DefExercicio[] = [
  // Superiores — empurrar
  { nome: "Supino reto com barra", grupoMuscular: "Peito", seriesAlvo: 4, repsAlvoMin: 8, repsAlvoMax: 10, cargaInicial: 60, incremento: 2.5, semanasPorBloco: 3 },
  { nome: "Supino inclinado com halteres", grupoMuscular: "Peito", seriesAlvo: 3, repsAlvoMin: 10, repsAlvoMax: 12, cargaInicial: 22, incremento: 2, semanasPorBloco: 4 },
  { nome: "Desenvolvimento militar", grupoMuscular: "Ombros", seriesAlvo: 4, repsAlvoMin: 8, repsAlvoMax: 10, cargaInicial: 35, incremento: 2.5, semanasPorBloco: 4 },
  { nome: "Elevação lateral", grupoMuscular: "Ombros", seriesAlvo: 3, repsAlvoMin: 12, repsAlvoMax: 15, cargaInicial: 8, incremento: 1, semanasPorBloco: 5 },
  { nome: "Tríceps testa", grupoMuscular: "Tríceps", seriesAlvo: 3, repsAlvoMin: 10, repsAlvoMax: 12, cargaInicial: 25, incremento: 2.5, semanasPorBloco: 5 },
  { nome: "Tríceps na corda", grupoMuscular: "Tríceps", seriesAlvo: 3, repsAlvoMin: 12, repsAlvoMax: 15, cargaInicial: 20, incremento: 2.5, semanasPorBloco: 4 },

  // Superiores — puxar
  { nome: "Puxada frontal", grupoMuscular: "Costas", seriesAlvo: 4, repsAlvoMin: 8, repsAlvoMax: 10, cargaInicial: 55, incremento: 5, semanasPorBloco: 4 },
  { nome: "Remada curvada", grupoMuscular: "Costas", seriesAlvo: 4, repsAlvoMin: 8, repsAlvoMax: 10, cargaInicial: 50, incremento: 2.5, semanasPorBloco: 3 },
  { nome: "Remada baixa", grupoMuscular: "Costas", seriesAlvo: 3, repsAlvoMin: 10, repsAlvoMax: 12, cargaInicial: 45, incremento: 5, semanasPorBloco: 4 },
  { nome: "Rosca direta", grupoMuscular: "Bíceps", seriesAlvo: 3, repsAlvoMin: 10, repsAlvoMax: 12, cargaInicial: 25, incremento: 2.5, semanasPorBloco: 5 },
  { nome: "Rosca martelo", grupoMuscular: "Bíceps", seriesAlvo: 3, repsAlvoMin: 10, repsAlvoMax: 12, cargaInicial: 12, incremento: 2, semanasPorBloco: 5 },

  // Inferiores — quadríceps
  { nome: "Agachamento livre", grupoMuscular: "Pernas", seriesAlvo: 4, repsAlvoMin: 6, repsAlvoMax: 8, cargaInicial: 80, incremento: 5, semanasPorBloco: 3 },
  { nome: "Leg press 45°", grupoMuscular: "Pernas", seriesAlvo: 4, repsAlvoMin: 10, repsAlvoMax: 12, cargaInicial: 140, incremento: 10, semanasPorBloco: 3 },
  { nome: "Cadeira extensora", grupoMuscular: "Pernas", seriesAlvo: 3, repsAlvoMin: 12, repsAlvoMax: 15, cargaInicial: 40, incremento: 5, semanasPorBloco: 4 },
  { nome: "Mesa flexora", grupoMuscular: "Posterior", seriesAlvo: 3, repsAlvoMin: 10, repsAlvoMax: 12, cargaInicial: 35, incremento: 5, semanasPorBloco: 4 },
  { nome: "Panturrilha em pé", grupoMuscular: "Panturrilha", seriesAlvo: 4, repsAlvoMin: 15, repsAlvoMax: 20, cargaInicial: 60, incremento: 5, semanasPorBloco: 4 },

  // Inferiores — posterior
  { nome: "Levantamento terra", grupoMuscular: "Posterior", seriesAlvo: 4, repsAlvoMin: 5, repsAlvoMax: 6, cargaInicial: 90, incremento: 5, semanasPorBloco: 3 },
  { nome: "Stiff", grupoMuscular: "Posterior", seriesAlvo: 3, repsAlvoMin: 8, repsAlvoMax: 10, cargaInicial: 60, incremento: 5, semanasPorBloco: 4 },
  { nome: "Cadeira flexora", grupoMuscular: "Posterior", seriesAlvo: 3, repsAlvoMin: 12, repsAlvoMax: 15, cargaInicial: 35, incremento: 5, semanasPorBloco: 4 },
  { nome: "Afundo com halteres", grupoMuscular: "Pernas", seriesAlvo: 3, repsAlvoMin: 10, repsAlvoMax: 12, cargaInicial: 16, incremento: 2, semanasPorBloco: 5 },
];

const PORNOME = new Map(CATALOGO.map((e) => [e.nome, e]));

/**
 * Os 4 treinos da rotina. `diasAtras` é a posição do treino em relação ao dia em
 * que o seed roda, não um dia da semana fixo — ver a nota sobre a escala relativa
 * no topo do arquivo. O padrão é o mesmo de sempre (2 dias on, 1 off, 2 on, 2
 * off), só girado pra terminar no dia do seed: rodando numa sexta, sai
 * exatamente seg/ter/qui/sex.
 *
 * Os offsets são distintos e todos < 7, então os `diaSemana` derivados também são
 * distintos — o schema tem @@unique([diaSemana]). Os nomes casam com os slugs de
 * src/lib/treino-imagem.ts, senão os cards perdem a imagem de fundo.
 */
const TREINOS: { nome: string; diasAtras: number; exercicios: string[] }[] = [
  {
    nome: "Superior",
    diasAtras: 4,
    exercicios: [
      "Supino reto com barra",
      "Supino inclinado com halteres",
      "Desenvolvimento militar",
      "Elevação lateral",
      "Tríceps testa",
      "Tríceps na corda",
    ],
  },
  {
    nome: "Inferior",
    diasAtras: 3,
    exercicios: [
      "Agachamento livre",
      "Leg press 45°",
      "Cadeira extensora",
      "Mesa flexora",
      "Panturrilha em pé",
    ],
  },
  {
    nome: "Superior 2",
    diasAtras: 1,
    exercicios: [
      "Puxada frontal",
      "Remada curvada",
      "Remada baixa",
      "Elevação lateral", // reaproveitado do Superior
      "Rosca direta",
      "Rosca martelo",
    ],
  },
  {
    nome: "Inferior 2",
    diasAtras: 0, // o dia em que o seed roda
    exercicios: [
      "Levantamento terra",
      "Stiff",
      "Cadeira flexora",
      "Afundo com halteres",
      "Panturrilha em pé", // reaproveitado do Inferior
    ],
  },
];

// ---------------------------------------------------------------------------
// Geração de séries
// ---------------------------------------------------------------------------

/**
 * Carga do exercício numa dada semana do histórico: sobe um incremento a cada
 * `semanasPorBloco`, com um "dia ruim" ocasional (um incremento a menos). É essa
 * subida lenta que faz a tela de "última vez" contar uma história de evolução.
 */
function cargaNaSemana(def: DefExercicio, semana: number): number {
  const nivel = Math.floor(semana / def.semanasPorBloco);
  const diaRuim = rng() < 0.18 ? 1 : 0;
  const carga = def.cargaInicial + def.incremento * Math.max(0, nivel - diaRuim);
  return Math.round(carga * 100) / 100;
}

/**
 * Reps de uma série: começa no topo da faixa alvo e cai conforme a fadiga das
 * séries seguintes, sem nunca descer mais que uma rep abaixo do alvo mínimo.
 */
function repsDaSerie(def: DefExercicio, indice: number): number {
  const queda = Math.min(indice, def.repsAlvoMax - def.repsAlvoMin);
  const extra = rng() < 0.3 ? 1 : 0;
  const reps = def.repsAlvoMax - queda - extra;
  return Math.max(Math.max(1, def.repsAlvoMin - 1), Math.min(def.repsAlvoMax, reps));
}

interface SerieNova {
  sessaoId: string;
  exercicioId: string;
  numero: number;
  carga: number;
  reps: number;
}

/**
 * Séries de um exercício dentro de uma sessão: `numero` é 1-based por exercício.
 *
 * `cargaFixa` sobrepõe a carga da semana — usado só pela sessão de exemplo, que
 * precisa de uma carga derivada da última vez, e não da curva do histórico.
 */
function seriesDoExercicio(
  def: DefExercicio,
  sessaoId: string,
  exercicioId: string,
  semana: number,
  cargaFixa?: number,
): SerieNova[] {
  const carga = cargaFixa ?? cargaNaSemana(def, semana);
  return Array.from({ length: def.seriesAlvo }, (_, i) => ({
    sessaoId,
    exercicioId,
    numero: i + 1,
    carga,
    reps: repsDaSerie(def, i),
  }));
}

// ---------------------------------------------------------------------------
// Conexão
// ---------------------------------------------------------------------------

/** A connection string do ambiente: direta de preferência (ver `conectar`). */
function connectionString(): string {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Nem DIRECT_URL nem DATABASE_URL definidas. Aponte o .env pro banco de demo.",
    );
  }
  return url;
}

/**
 * Host + database do banco alvo, pra confirmar a olho que não é produção. Só
 * host e path: a connection string tem senha e não pode ir pro console (nem pros
 * logs da Vercel).
 */
export function descreverAlvo(): string {
  try {
    const u = new URL(connectionString());
    return `${u.host}${u.pathname}`;
  } catch {
    return "(connection string em formato não reconhecido)";
  }
}

/**
 * O datasource do schema não declara `url` (Prisma 7), então o client precisa do
 * adapter. Preferimos a conexão DIRETA: são milhares de inserts e o pooler não
 * ajuda em nada aqui — por isso este client, e não o singleton pooled de
 * src/lib/prisma.ts.
 */
function conectar(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: connectionString() });
  return new PrismaClient({ adapter });
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

/** Contagens do que foi criado, pra o CLI imprimir e a rota devolver em JSON. */
export interface ResultadoSeed {
  treinos: number;
  exercicios: number;
  semanas: number;
  sessoesConcluidas: number;
  series: number;
  sessaoExemplo: { id: string; treino: string; series: number };
  duracaoMs: number;
}

/**
 * APAGA TUDO e repopula o banco do ambiente (DIRECT_URL/DATABASE_URL). Não tem
 * trava própria: quem chama é que decide se pode rodar — ver o cabeçalho.
 */
export async function seedDemo(): Promise<ResultadoSeed> {
  const comecou = Date.now();
  rng = criarRng(SEMENTE);

  const prisma = conectar();

  try {
    // Limpeza — a ordem importa: Sessao.treinoId e SerieRegistrada.exercicioId
    // são onDelete: Restrict, então os filhos saem primeiro.
    console.log("Limpando o banco…");
    await prisma.serieRegistrada.deleteMany();
    await prisma.sessao.deleteMany();
    await prisma.treinoExercicio.deleteMany();
    await prisma.treino.deleteMany();
    await prisma.exercicio.deleteMany();

    // --- Calendário ----------------------------------------------------------
    // Âncora de meia-noite UTC de uma data-calendário SP: aritmética de dia pura,
    // imune a DST (mesmo padrão de getStreak em src/lib/estatisticas.ts).
    const hoje = hojeEmSP();
    const ancoraHoje = Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia);
    const diaDoSeed = new Date(ancoraHoje).getUTCDay();
    const totalDias = SEMANAS * 7;
    const primeiroDia = ancoraHoje - (totalDias - 1) * DIA_MS;

    /** Dia da semana de um treino, derivado do dia em que o seed está rodando. */
    const diaSemanaDe = (t: { diasAtras: number }) =>
      (diaDoSeed - t.diasAtras + 7) % 7;

    const porDiaSemana = new Map(TREINOS.map((t) => [diaSemanaDe(t), t]));

    // --- Catálogo e treinos --------------------------------------------------
    console.log("Criando catálogo e treinos…");
    const exercicios = await prisma.exercicio.createManyAndReturn({
      data: CATALOGO.map((e) => ({
        nome: e.nome,
        grupoMuscular: e.grupoMuscular,
      })),
      select: { id: true, nome: true },
    });
    const idExercicio = new Map(exercicios.map((e) => [e.nome, e.id]));

    const treinos = await prisma.treino.createManyAndReturn({
      data: TREINOS.map((t) => ({ nome: t.nome, diaSemana: diaSemanaDe(t) })),
      select: { id: true, nome: true },
    });
    const idTreino = new Map(treinos.map((t) => [t.nome, t.id]));

    await prisma.treinoExercicio.createMany({
      data: TREINOS.flatMap((t) =>
        t.exercicios.map((nome, ordem) => {
          const def = PORNOME.get(nome)!;
          return {
            treinoId: idTreino.get(t.nome)!,
            exercicioId: idExercicio.get(nome)!,
            seriesAlvo: def.seriesAlvo,
            repsAlvoMin: def.repsAlvoMin,
            repsAlvoMax: def.repsAlvoMax,
            ordem, // 0-based, como nas actions do app
          };
        }),
      ),
    });

    /**
     * Instante de uma sessão: ~19h no fuso SP do dia-calendário do cursor.
     *
     * `margemMin` é o teto pro dia em que o seed roda: uma sessão não pode nascer
     * no futuro, então se ainda não passou das 19h ela recua pra `margemMin`
     * minutos atrás. Dias passados nunca caem nesse caso — as 19h deles já foram.
     */
    function instanteDaSessao(
      cursor: Date,
      minutosApos19h: number,
      margemMin = 0,
    ): Date {
      const meiaNoiteSP = inicioDoDiaSP(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth() + 1,
        cursor.getUTCDate(),
      ).getTime();
      const alvo = meiaNoiteSP + (19 * 60 + minutosApos19h) * 60_000;
      const teto = Date.now() - margemMin * 60_000;
      if (alvo <= teto) return new Date(alvo);
      // O piso na meia-noite impede escapar pro dia anterior se o seed rodar
      // logo depois da virada.
      return new Date(Math.max(meiaNoiteSP, teto));
    }

    // --- Sessões concluídas --------------------------------------------------
    console.log(`Gerando ${SEMANAS} semanas de sessões concluídas…`);

    interface SessaoNova {
      treinoNome: string;
      data: Date;
      duracaoMin: number;
      semana: number;
    }
    const planejadas: SessaoNova[] = [];

    // Todos os dias agendados do intervalo, incluindo o dia do seed. Deixá-lo de
    // fora zerava o streak no dia seguinte: ele viraria um dia agendado sem
    // CONCLUIDA, e num banco estático esse buraco nunca se preenche.
    const diasAgendados: number[] = [];
    for (let i = 0; i < totalDias; i++) {
      const cursorMs = primeiroDia + i * DIA_MS;
      if (cursorMs > ancoraHoje) break;
      if (porDiaSemana.has(new Date(cursorMs).getUTCDay())) {
        diasAgendados.push(cursorMs);
      }
    }
    // A ponta protegida: nos últimos DIAS_AGENDADOS_SEM_FALTA dias agendados não
    // se falta, pra o streak da tela inicial nascer alto.
    const inicioProtegido =
      diasAgendados[diasAgendados.length - DIAS_AGENDADOS_SEM_FALTA] ?? -Infinity;

    for (const cursorMs of diasAgendados) {
      const cursor = new Date(cursorMs);
      const treino = porDiaSemana.get(cursor.getUTCDay())!;

      const semana = Math.floor((cursorMs - primeiroDia) / DIA_MS / 7);
      if (semana === SEMANA_FERIAS) continue; // semana de viagem
      const protegido = cursorMs >= inicioProtegido;
      if (!protegido && rng() < CHANCE_FALTA) continue; // falta isolada

      planejadas.push({
        treinoNome: treino.nome,
        // Só o dia do seed precisa do teto; a margem afasta a concluída de hoje
        // da sessão EM_ANDAMENTO de exemplo, que nasce mais perto de agora.
        data: instanteDaSessao(
          cursor,
          inteiroEntre(0, 59),
          cursorMs === ancoraHoje ? 90 : 0,
        ),
        duracaoMin: inteiroEntre(45, 75),
        semana,
      });
    }

    const criadas = await prisma.sessao.createManyAndReturn({
      data: planejadas.map((s) => ({
        treinoId: idTreino.get(s.treinoNome)!,
        data: s.data,
        // getUltimaVez desempata por createdAt: sem gravar, todas nasceriam
        // "agora" e o desempate ficaria arbitrário.
        createdAt: s.data,
        duracaoMin: s.duracaoMin,
        status: "CONCLUIDA" as const,
      })),
      select: { id: true, data: true },
    });

    // Casa a sessão criada com a planejada pelo instante (único por sessão).
    const idPorInstante = new Map(criadas.map((s) => [s.data.getTime(), s.id]));

    const series: SerieNova[] = [];
    /**
     * exercicioId → carga da sessão concluída mais recente que o incluiu, que é
     * o que o app mostra como "última vez". `planejadas` está em ordem
     * cronológica, então a última escrita vence — inclusive para exercícios
     * reaproveitados entre treinos, que é a semântica do getUltimaVez (global,
     * não por treino).
     */
    const cargaUltimaVez = new Map<string, number>();
    for (const s of planejadas) {
      const sessaoId = idPorInstante.get(s.data.getTime())!;
      const treino = TREINOS.find((t) => t.nome === s.treinoNome)!;
      for (const nome of treino.exercicios) {
        const exercicioId = idExercicio.get(nome)!;
        const doExercicio = seriesDoExercicio(
          PORNOME.get(nome)!,
          sessaoId,
          exercicioId,
          s.semana,
        );
        series.push(...doExercicio);
        cargaUltimaVez.set(exercicioId, doExercicio[0].carga);
      }
    }

    // Lotes: um create por série seriam milhares de round-trips.
    const LOTE = 1000;
    for (let i = 0; i < series.length; i += LOTE) {
      await prisma.serieRegistrada.createMany({ data: series.slice(i, i + LOTE) });
    }

    // --- Sessão EM_ANDAMENTO de exemplo --------------------------------------
    // O treino MAIS ANTIGO da escala, não o de hoje: assim a "última vez" de cada
    // exercício dela cai na concluída de vários dias atrás, com carga menor — que
    // é o conceito que a demo precisa vender. O treino de hoje continua com a sua
    // concluída (é ela que segura o streak); ele é que não pode ser o do exemplo,
    // senão a comparação apontaria pro próprio dia.
    const treinoExemplo = TREINOS.reduce((a, b) =>
      b.diasAtras > a.diasAtras ? b : a,
    );

    // Margem menor que a da concluída de hoje: a sessão em andamento é a mais
    // recente, e nenhuma das duas nasce no futuro.
    const dataExemplo = instanteDaSessao(
      new Date(ancoraHoje),
      inteiroEntre(0, 40),
      20,
    );
    await prisma.sessao.create({
      data: {
        id: ID_SESSAO_EXEMPLO,
        treinoId: idTreino.get(treinoExemplo.nome)!,
        data: dataExemplo,
        createdAt: dataExemplo,
        status: "EM_ANDAMENTO",
      },
    });

    // Só os 2 primeiros exercícios já têm série anotada: o resto fica pendente,
    // que é o estado interessante pra demo (mostra o "última vez" preenchido).
    //
    // A carga é a da última vez MAIS um incremento, não a da curva do histórico:
    // as duas cairiam na mesma semana e sairiam empatadas (ou menores, pelo "dia
    // ruim" do cargaNaSemana). Aqui a progressão é sempre visível ao lado do card
    // "última vez", que é o ponto da tela.
    const seriesExemplo = treinoExemplo.exercicios
      .slice(0, 2)
      .flatMap((nome) => {
        const def = PORNOME.get(nome)!;
        const exercicioId = idExercicio.get(nome)!;
        const anterior = cargaUltimaVez.get(exercicioId) ?? def.cargaInicial;
        return seriesDoExercicio(
          def,
          ID_SESSAO_EXEMPLO,
          exercicioId,
          SEMANAS - 1,
          anterior + def.incremento,
        );
      });
    await prisma.serieRegistrada.createMany({ data: seriesExemplo });

    return {
      treinos: treinos.length,
      exercicios: exercicios.length,
      semanas: SEMANAS,
      sessoesConcluidas: criadas.length,
      series: series.length,
      sessaoExemplo: {
        id: ID_SESSAO_EXEMPLO,
        treino: treinoExemplo.nome,
        series: seriesExemplo.length,
      },
      duracaoMs: Date.now() - comecou,
    };
  } finally {
    await prisma.$disconnect();
  }
}
