"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NOMES_DIAS, parseDiaSemana } from "@/lib/dias-semana";
import { isModoDemo, TEXTO_MODO_DEMO } from "@/lib/demo";

export type ExercicioResult = { ok: true } | { error: string };

/** Detecta a violação de constraint única do Postgres (dia já ocupado). */
function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

/**
 * Altera ou remove o dia da semana de um treino. Valida no servidor (dia nulo ou
 * entre 0 e 6; dia não ocupado por OUTRO treino) e revalida as telas afetadas.
 * Selecionar "Sem dia definido" (null) transforma o treino em avulso.
 */
export async function definirDiaTreino(
  formData: FormData,
): Promise<ExercicioResult> {
  if (isModoDemo()) return { error: TEXTO_MODO_DEMO };

  const treinoId = String(formData.get("treinoId") ?? "");
  if (treinoId === "") {
    return { error: "Treino inválido" };
  }

  const dia = parseDiaSemana(formData.get("diaSemana"));
  if (!dia.ok) {
    return { error: "Dia inválido" };
  }

  // Pré-checagem amigável: outro treino já ocupa o dia?
  if (dia.diaSemana !== null) {
    const ocupado = await prisma.treino.findUnique({
      where: { diaSemana: dia.diaSemana },
    });
    if (ocupado && ocupado.id !== treinoId) {
      return { error: `${NOMES_DIAS[dia.diaSemana]} já tem um treino` };
    }
  }

  try {
    await prisma.treino.update({
      where: { id: treinoId },
      data: { diaSemana: dia.diaSemana },
    });
  } catch (e) {
    if (dia.diaSemana !== null && isUniqueViolation(e)) {
      return { error: `${NOMES_DIAS[dia.diaSemana]} já tem um treino` };
    }
    throw e;
  }

  revalidatePath(`/treinos/${treinoId}`);
  revalidatePath("/treinos");
  revalidatePath("/");

  return { ok: true };
}

/**
 * Adiciona um exercício ao treino. Valida no servidor, reutiliza o Exercicio do
 * catálogo se já existir um com esse nome (case-insensitive, com trim) ou cria
 * um novo, e liga ao treino via TreinoExercicio com `ordem` = próximo índice.
 */
export async function adicionarExercicio(
  formData: FormData,
): Promise<ExercicioResult> {
  if (isModoDemo()) return { error: TEXTO_MODO_DEMO };

  const treinoId = String(formData.get("treinoId") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const grupoMuscular = String(formData.get("grupoMuscular") ?? "").trim();
  const seriesAlvo = Number(formData.get("seriesAlvo"));
  const repsAlvoMin = Number(formData.get("repsAlvoMin"));
  const repsAlvoMax = Number(formData.get("repsAlvoMax"));

  if (treinoId === "") {
    return { error: "Treino inválido" };
  }
  if (nome === "") {
    return { error: "Informe o nome do exercício" };
  }
  if (!Number.isInteger(seriesAlvo) || seriesAlvo < 1) {
    return { error: "Séries alvo deve ser um inteiro maior que zero" };
  }
  if (!Number.isInteger(repsAlvoMin) || repsAlvoMin < 1) {
    return { error: "Reps mínimo deve ser um inteiro maior que zero" };
  }
  if (!Number.isInteger(repsAlvoMax) || repsAlvoMax < 1) {
    return { error: "Reps máximo deve ser um inteiro maior que zero" };
  }
  if (repsAlvoMin > repsAlvoMax) {
    return { error: "Reps mínimo não pode ser maior que o máximo" };
  }

  // Reutiliza o exercício do catálogo se já existir (case-insensitive).
  let exercicio = await prisma.exercicio.findFirst({
    where: { nome: { equals: nome, mode: "insensitive" } },
  });

  if (!exercicio) {
    if (grupoMuscular === "") {
      return { error: "Informe o grupo muscular" };
    }
    exercicio = await prisma.exercicio.create({
      data: { nome, grupoMuscular },
    });
  }

  // Evita duplicar o mesmo exercício no treino (@@unique treinoId+exercicioId).
  const jaNoTreino = await prisma.treinoExercicio.findUnique({
    where: {
      treinoId_exercicioId: { treinoId, exercicioId: exercicio.id },
    },
  });
  if (jaNoTreino) {
    return { error: "Esse exercício já está no treino" };
  }

  const ultimo = await prisma.treinoExercicio.aggregate({
    where: { treinoId },
    _max: { ordem: true },
  });
  const ordem = (ultimo._max.ordem ?? -1) + 1;

  await prisma.treinoExercicio.create({
    data: {
      treinoId,
      exercicioId: exercicio.id,
      seriesAlvo,
      repsAlvoMin,
      repsAlvoMax,
      ordem,
    },
  });

  revalidatePath(`/treinos/${treinoId}`);
  return { ok: true };
}

/**
 * Remove um exercício do treino: deleta apenas o vínculo (TreinoExercicio),
 * preservando o Exercicio no catálogo.
 */
export async function removerExercicio(
  formData: FormData,
): Promise<ExercicioResult> {
  if (isModoDemo()) return { error: TEXTO_MODO_DEMO };

  const treinoExercicioId = String(formData.get("treinoExercicioId") ?? "");
  const treinoId = String(formData.get("treinoId") ?? "");

  if (treinoExercicioId === "" || treinoId === "") {
    return { error: "Dados inválidos" };
  }

  await prisma.treinoExercicio.delete({ where: { id: treinoExercicioId } });

  revalidatePath(`/treinos/${treinoId}`);
  return { ok: true };
}

export type DeletarTreinoResult =
  | { ok: "excluido" }
  | { ok: "arquivado" }
  | { error: string };

/**
 * Deleta ou arquiva um treino (regra híbrida pra preservar histórico):
 * - Sem sessões: deleta de verdade (o Cascade em TreinoExercicio limpa os
 *   vínculos; o catálogo de Exercicio permanece).
 * - Com sessões: arquiva (arquivado = true) e libera o dia da semana
 *   (diaSemana = null, senão o @@unique prenderia o slot). As sessões seguem
 *   visíveis no histórico e na "última vez".
 */
export async function deletarTreino(
  treinoId: string,
): Promise<DeletarTreinoResult> {
  if (isModoDemo()) return { error: TEXTO_MODO_DEMO };

  if (treinoId === "") {
    return { error: "Treino inválido" };
  }

  const totalSessoes = await prisma.sessao.count({ where: { treinoId } });

  if (totalSessoes === 0) {
    await prisma.treino.delete({ where: { id: treinoId } });
  } else {
    await prisma.treino.update({
      where: { id: treinoId },
      data: { arquivado: true, diaSemana: null },
    });
  }

  revalidatePath("/treinos");
  revalidatePath("/");
  revalidatePath(`/treinos/${treinoId}`);

  return { ok: totalSessoes === 0 ? "excluido" : "arquivado" };
}
