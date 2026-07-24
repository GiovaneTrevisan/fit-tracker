"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NOMES_DIAS, parseDiaSemana } from "@/lib/dias-semana";
import { isModoDemo, TEXTO_MODO_DEMO } from "@/lib/demo";

export type CriarTreinoResult = { ok: true } | { error: string };

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
 * Cria um treino a partir do formulário. Valida no servidor (nome não vazio; dia
 * nulo ou entre 0 e 6; dia ainda não ocupado por outro treino) e revalida as
 * telas afetadas para refletir o novo treino.
 */
export async function criarTreino(
  formData: FormData,
): Promise<CriarTreinoResult> {
  if (isModoDemo()) return { error: TEXTO_MODO_DEMO };

  const nome = String(formData.get("nome") ?? "").trim();

  if (nome === "") {
    return { error: "Informe um nome" };
  }

  const dia = parseDiaSemana(formData.get("diaSemana"));
  if (!dia.ok) {
    return { error: "Dia inválido" };
  }

  // Pré-checagem amigável antes de deixar o banco estourar a @@unique.
  if (dia.diaSemana !== null) {
    const ocupado = await prisma.treino.findUnique({
      where: { diaSemana: dia.diaSemana },
    });
    if (ocupado) {
      return { error: `${NOMES_DIAS[dia.diaSemana]} já tem um treino` };
    }
  }

  try {
    await prisma.treino.create({
      data: { nome, diaSemana: dia.diaSemana },
    });
  } catch (e) {
    // Rede de segurança contra corrida entre a pré-checagem e o insert.
    if (dia.diaSemana !== null && isUniqueViolation(e)) {
      return { error: `${NOMES_DIAS[dia.diaSemana]} já tem um treino` };
    }
    throw e;
  }

  revalidatePath("/treinos");
  revalidatePath("/");

  return { ok: true };
}
