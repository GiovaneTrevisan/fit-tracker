/**
 * Seed do banco de DEMONSTRAÇÃO.
 *
 * Popula um banco descartável com ~6 meses de histórico fictício (mas plausível)
 * pro deploy público de portfólio: 4 treinos com dia da semana, catálogo de
 * exercícios reais, sessões concluídas com progressão de carga e uma sessão
 * EM_ANDAMENTO fixa pra onde o DEMO_SESSAO_ID aponta.
 *
 * NUNCA rodar contra produção: o script APAGA TUDO antes de popular. A trava é a
 * env SEED_DEMO="true" — sem ela o script aborta sem tocar no banco.
 *
 * Rodar:  SEED_DEMO=true npx prisma db seed   (ver "Banco de demonstração" no README)
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
const ID_SESSAO_EXEMPLO = "demo-sessao-exemplo";

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

const rng = criarRng(20260727);

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

/** Séries de um exercício dentro de uma sessão: `numero` é 1-based por exercício. */
function seriesDoExercicio(
  def: DefExercicio,
  sessaoId: string,
  exercicioId: string,
  semana: number,
): SerieNova[] {
  const carga = cargaNaSemana(def, semana);
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

/**
 * O datasource do schema não declara `url` (Prisma 7), então o client precisa do
 * adapter. Preferimos a conexão DIRETA: são milhares de inserts e o pooler não
 * ajuda em nada aqui.
 */
function conectar(): { prisma: PrismaClient; alvo: string } {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Nem DIRECT_URL nem DATABASE_URL definidas. Aponte o .env pro banco de demo.",
    );
  }

  // Só host + database: a connection string tem senha e não pode ir pro console.
  let alvo: string;
  try {
    const u = new URL(connectionString);
    alvo = `${u.host}${u.pathname}`;
  } catch {
    alvo = "(connection string em formato não reconhecido)";
  }

  const adapter = new PrismaPg({ connectionString });
  return { prisma: new PrismaClient({ adapter }), alvo };
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  const { prisma, alvo } = conectar();

  console.log(`\nBanco alvo: ${alvo}`);

  if (process.env.SEED_DEMO !== "true") {
    await prisma.$disconnect();
    throw new Error(
      "Este script APAGA TUDO antes de popular e só roda no banco de demo.\n" +
        "Confirme com SEED_DEMO=\"true\" no ambiente (ou no .env) se o banco acima é mesmo o de demonstração.",
    );
  }

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
    for (const s of planejadas) {
      const sessaoId = idPorInstante.get(s.data.getTime())!;
      const treino = TREINOS.find((t) => t.nome === s.treinoNome)!;
      for (const nome of treino.exercicios) {
        series.push(
          ...seriesDoExercicio(
            PORNOME.get(nome)!,
            sessaoId,
            idExercicio.get(nome)!,
            s.semana,
          ),
        );
      }
    }

    // Lotes: um create por série seriam milhares de round-trips.
    const LOTE = 1000;
    for (let i = 0; i < series.length; i += LOTE) {
      await prisma.serieRegistrada.createMany({ data: series.slice(i, i + LOTE) });
    }

    // --- Sessão EM_ANDAMENTO de exemplo --------------------------------------
    // A escala termina no dia do seed (diasAtras: 0), então hoje é sempre dia de
    // treino e o exemplo é o treino de hoje.
    const treinoExemplo = porDiaSemana.get(diaDoSeed)!;

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
    const seriesExemplo = treinoExemplo.exercicios
      .slice(0, 2)
      .flatMap((nome) =>
        seriesDoExercicio(
          PORNOME.get(nome)!,
          ID_SESSAO_EXEMPLO,
          idExercicio.get(nome)!,
          SEMANAS - 1,
        ),
      );
    await prisma.serieRegistrada.createMany({ data: seriesExemplo });

    // --- Resumo --------------------------------------------------------------
    console.log("\nPronto:");
    console.log(`  ${treinos.length} treinos, ${exercicios.length} exercícios`);
    console.log(
      `  ${criadas.length} sessões concluídas (${SEMANAS} semanas), ${series.length} séries`,
    );
    console.log(
      `  1 sessão EM_ANDAMENTO em "${treinoExemplo.nome}" com ${seriesExemplo.length} séries`,
    );
    console.log("\nCole no .env do ambiente de demo:");
    console.log(`  DEMO_SESSAO_ID="${ID_SESSAO_EXEMPLO}"\n`);

    await prisma.$disconnect();
  } catch (erro) {
    await prisma.$disconnect();
    throw erro;
  }
}

main().catch((erro) => {
  console.error(`\n${erro instanceof Error ? erro.message : erro}\n`);
  process.exit(1);
});
