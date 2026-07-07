"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ExercicioResult = { ok: true } | { error: string };

/**
 * Adiciona um exercício ao treino. Valida no servidor, reutiliza o Exercicio do
 * catálogo se já existir um com esse nome (case-insensitive, com trim) ou cria
 * um novo, e liga ao treino via TreinoExercicio com `ordem` = próximo índice.
 */
export async function adicionarExercicio(
  formData: FormData,
): Promise<ExercicioResult> {
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
  const treinoExercicioId = String(formData.get("treinoExercicioId") ?? "");
  const treinoId = String(formData.get("treinoId") ?? "");

  if (treinoExercicioId === "" || treinoId === "") {
    return { error: "Dados inválidos" };
  }

  await prisma.treinoExercicio.delete({ where: { id: treinoExercicioId } });

  revalidatePath(`/treinos/${treinoId}`);
  return { ok: true };
}
