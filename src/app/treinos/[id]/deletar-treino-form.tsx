"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { deletarTreino } from "./actions";

/**
 * Botão de excluir treino com confirmação inline em dois passos (sem confirm()
 * nativo, que dispara modal do navegador). A action decide o destino:
 * - "excluido": treino não existe mais → volta pra /treinos.
 * - "arquivado": tinha sessões → refresh mostra o selo "Arquivado" e some a UI
 *   de escrita, com mensagem explicando o motivo.
 */
export function DeletarTreinoForm({ treinoId }: { treinoId: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function excluir() {
    startTransition(async () => {
      const resultado = await deletarTreino(treinoId);
      if ("error" in resultado) {
        setErro(resultado.error);
        return;
      }
      setErro(null);
      if (resultado.ok === "excluido") {
        router.push("/treinos");
      } else {
        setConfirmando(false);
        setAviso("Treino arquivado (tem sessões no histórico).");
        router.refresh();
      }
    });
  }

  if (!confirmando) {
    return (
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="text-rotulo text-red-600 hover:underline"
        >
          Excluir treino
        </button>
        {aviso && (
          <p className="mt-2 text-rotulo text-texto-suave">{aviso}</p>
        )}
        {erro && (
          <p className="mt-2 text-sm text-red-600">{erro}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-2">
      <p className="text-rotulo text-texto-suave">
        Tem certeza? Treinos com sessões registradas são arquivados; sem sessões,
        são excluídos de vez.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={excluir}
          disabled={isPending}
          className="rounded-full bg-red-600 px-5 py-2.5 text-rotulo font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "Excluindo..." : "Confirmar exclusão"}
        </button>
        <Button
          type="button"
          variante="contorno"
          onClick={() => setConfirmando(false)}
          disabled={isPending}
          className="disabled:opacity-50"
        >
          Cancelar
        </Button>
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </div>
  );
}
