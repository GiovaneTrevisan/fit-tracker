import { prisma } from "@/lib/prisma";
import { hojeEmSP } from "@/lib/data-sp";

export interface TreinoResumo {
  id: string;
  nome: string;
  diaSemana: number | null;
  totalExercicios: number;
}

/**
 * Lista os treinos cadastrados, ordenados por criação (mais antigo primeiro),
 * com o nome e a contagem de exercícios de cada um.
 */
export async function getTreinos(): Promise<TreinoResumo[]> {
  const treinos = await prisma.treino.findMany({
    where: { arquivado: false },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { exercicios: true } } },
  });

  return treinos.map((t) => ({
    id: t.id,
    nome: t.nome,
    diaSemana: t.diaSemana,
    totalExercicios: t._count.exercicios,
  }));
}

export interface SemanaDeTreinos {
  /** 7 baldes indexados por diaSemana (0=Domingo … 6=Sábado). Cada dia pode ter
   *  mais de um treino (o schema não impõe unicidade), então é lista por dia. */
  porDia: TreinoResumo[][];
  /** Treinos avulsos (sem dia da semana). */
  avulsos: TreinoResumo[];
}

/**
 * Treinos não arquivados organizados para a visão semanal: distribuídos pelos 7
 * dias da semana + uma lista separada de avulsos (diaSemana null). Mesma base de
 * `getTreinos` (contagem de exercícios via `_count`), só reorganizada.
 */
export async function getTreinosDaSemana(): Promise<SemanaDeTreinos> {
  const treinos = await prisma.treino.findMany({
    where: { arquivado: false },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { exercicios: true } } },
  });

  const porDia: TreinoResumo[][] = Array.from({ length: 7 }, () => []);
  const avulsos: TreinoResumo[] = [];

  for (const t of treinos) {
    const resumo: TreinoResumo = {
      id: t.id,
      nome: t.nome,
      diaSemana: t.diaSemana,
      totalExercicios: t._count.exercicios,
    };
    if (t.diaSemana === null) avulsos.push(resumo);
    else porDia[t.diaSemana].push(resumo);
  }

  return { porDia, avulsos };
}

export interface ExercicioDoTreino {
  treinoExercicioId: string;
  nome: string;
  grupoMuscular: string;
  seriesAlvo: number;
  repsAlvoMin: number;
  repsAlvoMax: number;
}

export interface TreinoDetalhe {
  id: string;
  nome: string;
  diaSemana: number | null;
  arquivado: boolean;
  exercicios: ExercicioDoTreino[];
}

/**
 * Busca um treino pelo id com seus exercícios (via TreinoExercicio → Exercicio),
 * ordenados por `ordem`. Retorna `null` se o treino não existir.
 */
export async function getTreino(id: string): Promise<TreinoDetalhe | null> {
  const treino = await prisma.treino.findUnique({
    where: { id },
    include: {
      exercicios: {
        orderBy: { ordem: "asc" },
        include: { exercicio: true },
      },
    },
  });

  if (!treino) return null;

  return {
    id: treino.id,
    nome: treino.nome,
    diaSemana: treino.diaSemana,
    arquivado: treino.arquivado,
    exercicios: treino.exercicios.map((te) => ({
      treinoExercicioId: te.id,
      nome: te.exercicio.nome,
      grupoMuscular: te.exercicio.grupoMuscular,
      seriesAlvo: te.seriesAlvo,
      repsAlvoMin: te.repsAlvoMin,
      repsAlvoMax: te.repsAlvoMax,
    })),
  };
}

export interface TreinoDeHoje {
  id: string;
  nome: string;
  diaSemana: number;
}

/**
 * Treino agendado para o dia de hoje no fuso America/Sao_Paulo, ou `null` se
 * hoje for dia de descanso (nenhum treino com esse diaSemana).
 *
 * O dia-da-semana é derivado da data-calendário SP (via `hojeEmSP`) construída
 * em UTC + `getUTCDay()` — nunca `new Date().getDay()` cru, que dependeria do
 * fuso do runtime (o deploy na Vercel roda em UTC).
 */
export async function getTreinoDeHoje(): Promise<TreinoDeHoje | null> {
  const { ano, mes, dia } = hojeEmSP();
  const diaHoje = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();

  const treino = await prisma.treino.findFirst({
    where: { diaSemana: diaHoje, arquivado: false },
    select: { id: true, nome: true, diaSemana: true },
  });

  if (!treino || treino.diaSemana === null) return null;

  return { id: treino.id, nome: treino.nome, diaSemana: treino.diaSemana };
}
