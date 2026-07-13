"use server";

import { revalidatePath } from "next/cache";
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
