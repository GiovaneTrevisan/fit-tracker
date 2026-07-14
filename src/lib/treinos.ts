import { prisma } from "@/lib/prisma";
import { hojeEmSP } from "@/lib/historico";

/**
 * Nomes dos dias da semana indexados pela convenção do domínio (0=Domingo …
 * 6=Sábado), a mesma do calendário. Reutilizado em selos, no select do form e
 * nas mensagens de erro das actions.
 */
export const NOMES_DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

/**
 * Normaliza/valida o valor cru de `diaSemana` vindo de um form: string vazia
 * (opção "Sem dia definido") vira `null`; senão precisa ser inteiro em [0,6].
 * Reutilizado pelas actions de criar e de editar o dia do treino.
 */
export function parseDiaSemana(
  raw: FormDataEntryValue | null,
): { ok: true; diaSemana: number | null } | { ok: false } {
  const s = String(raw ?? "").trim();
  if (s === "") return { ok: true, diaSemana: null };
  const n = Number(s);
  if (!Number.isInteger(n) || n < 0 || n > 6) return { ok: false };
  return { ok: true, diaSemana: n };
}

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

  const treino = await prisma.treino.findUnique({
    where: { diaSemana: diaHoje },
    select: { id: true, nome: true, diaSemana: true },
  });

  if (!treino || treino.diaSemana === null) return null;

  return { id: treino.id, nome: treino.nome, diaSemana: treino.diaSemana };
}
