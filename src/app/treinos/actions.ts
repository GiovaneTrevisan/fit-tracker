"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type CriarTreinoResult = { ok: true } | { error: string };

/**
 * Cria um treino a partir do formulário. Valida no servidor (nome não vazio,
 * com trim) e revalida /treinos para a lista refletir o novo treino.
 */
export async function criarTreino(
  formData: FormData,
): Promise<CriarTreinoResult> {
  const nome = String(formData.get("nome") ?? "").trim();

  if (nome === "") {
    return { error: "Informe um nome" };
  }

  await prisma.treino.create({ data: { nome } });
  revalidatePath("/treinos");

  return { ok: true };
}
