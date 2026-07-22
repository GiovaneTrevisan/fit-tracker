"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type SerieResult = { ok: true } | { error: string };

/**
 * Registra uma série real (carga + reps) de um exercício numa sessão. Valida no
 * servidor. O `numero` é a próxima posição da sequência daquele exercício nesta
 * sessão (começa em 1). Revalida a página da sessão.
 */
export async function adicionarSerie(
  formData: FormData,
): Promise<SerieResult> {
  const sessaoId = String(formData.get("sessaoId") ?? "");
  const exercicioId = String(formData.get("exercicioId") ?? "");
  const carga = Number(formData.get("carga"));
  const reps = Number(formData.get("reps"));

  if (sessaoId === "" || exercicioId === "") {
    return { error: "Dados inválidos" };
  }
  if (!Number.isFinite(carga) || carga <= 0) {
    return { error: "Carga deve ser maior que zero" };
  }
  if (!Number.isInteger(reps) || reps < 1) {
    return { error: "Reps deve ser um inteiro maior que zero" };
  }

  const ultima = await prisma.serieRegistrada.aggregate({
    where: { sessaoId, exercicioId },
    _max: { numero: true },
  });
  const numero = (ultima._max.numero ?? 0) + 1;

  await prisma.serieRegistrada.create({
    data: { sessaoId, exercicioId, numero, carga, reps },
  });

  revalidatePath(`/sessoes/${sessaoId}`);
  return { ok: true };
}

/**
 * Adiciona um exercício avulso (fora do plano) a uma sessão em andamento, já com
 * a primeira série. Valida no servidor. Reutiliza o Exercicio do catálogo se já
 * existir um com esse nome (case-insensitive, com trim) ou cria um novo — mesma
 * lógica de `adicionarExercicio` do treino; o grupo muscular só é exigido quando
 * o exercício é novo. A série liga direto sessão + exercício (SerieRegistrada não
 * passa por TreinoExercicio), então nada de plano é tocado: se o exercício já
 * estiver no treino, a série simplesmente entra nele.
 */
export async function adicionarExercicioAvulso(
  formData: FormData,
): Promise<SerieResult> {
  const sessaoId = String(formData.get("sessaoId") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const grupoMuscular = String(formData.get("grupoMuscular") ?? "").trim();
  const carga = Number(formData.get("carga"));
  const reps = Number(formData.get("reps"));

  if (sessaoId === "") {
    return { error: "Sessão inválida" };
  }
  if (nome === "") {
    return { error: "Informe o nome do exercício" };
  }
  if (!Number.isFinite(carga) || carga <= 0) {
    return { error: "Carga deve ser maior que zero" };
  }
  if (!Number.isInteger(reps) || reps < 1) {
    return { error: "Reps deve ser um inteiro maior que zero" };
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

  const ultima = await prisma.serieRegistrada.aggregate({
    where: { sessaoId, exercicioId: exercicio.id },
    _max: { numero: true },
  });
  const numero = (ultima._max.numero ?? 0) + 1;

  await prisma.serieRegistrada.create({
    data: { sessaoId, exercicioId: exercicio.id, numero, carga, reps },
  });

  revalidatePath(`/sessoes/${sessaoId}`);
  return { ok: true };
}

/**
 * Remove uma série registrada. Revalida a página da sessão.
 */
export async function removerSerie(
  formData: FormData,
): Promise<SerieResult> {
  const serieId = String(formData.get("serieId") ?? "");
  const sessaoId = String(formData.get("sessaoId") ?? "");

  if (serieId === "" || sessaoId === "") {
    return { error: "Dados inválidos" };
  }

  await prisma.serieRegistrada.delete({ where: { id: serieId } });

  revalidatePath(`/sessoes/${sessaoId}`);
  return { ok: true };
}

/**
 * Conclui a sessão: muda o status para CONCLUIDA. Só conclui se estiver
 * EM_ANDAMENTO (se já estiver CONCLUIDA, apenas redireciona, sem erro).
 * Redireciona para a página do treino da sessão.
 */
export async function concluirSessao(sessaoId: string): Promise<never> {
  if (!sessaoId) {
    throw new Error("Sessão inválida");
  }

  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    select: { treinoId: true, status: true },
  });
  if (!sessao) {
    throw new Error("Sessão não encontrada");
  }

  // Só conclui se estiver em andamento; se já concluída, apenas redireciona.
  if (sessao.status === "EM_ANDAMENTO") {
    await prisma.sessao.update({
      where: { id: sessaoId },
      data: { status: "CONCLUIDA" },
    });
  }

  redirect(`/treinos/${sessao.treinoId}`);
}
