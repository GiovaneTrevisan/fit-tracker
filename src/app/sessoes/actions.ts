"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDemoSessaoId, isModoDemo, TEXTO_MODO_DEMO } from "@/lib/demo";

/**
 * Inicia uma sessão para o treino. Idempotente por treino: se já existir uma
 * Sessao EM_ANDAMENTO, reusa em vez de criar outra. Em ambos os casos,
 * redireciona para /sessoes/{id}. Valida no servidor.
 */
export async function iniciarSessao(treinoId: string): Promise<never> {
  // Em modo demo não cria nada: manda pra sessão de exemplo, pra a demo mostrar
  // a tela de execução. Sem a env configurada, recusa lançando (a action termina
  // em redirect, então não tem canal de erro — mesmo caminho das validações
  // abaixo): a env destrava só a navegação, nunca a criação.
  if (isModoDemo()) {
    const demoSessaoId = getDemoSessaoId();
    if (!demoSessaoId) {
      throw new Error(TEXTO_MODO_DEMO);
    }
    redirect(`/sessoes/${demoSessaoId}`);
  }

  if (!treinoId) {
    throw new Error("Treino inválido");
  }

  // Garante que o treino existe (valida o input e evita erro de FK).
  const treino = await prisma.treino.findUnique({ where: { id: treinoId } });
  if (!treino) {
    throw new Error("Treino não encontrado");
  }

  const emAndamento = await prisma.sessao.findFirst({
    where: { treinoId, status: "EM_ANDAMENTO" },
    orderBy: { createdAt: "desc" },
  });

  // status default = EM_ANDAMENTO (schema)
  const sessao =
    emAndamento ?? (await prisma.sessao.create({ data: { treinoId } }));

  redirect(`/sessoes/${sessao.id}`);
}
