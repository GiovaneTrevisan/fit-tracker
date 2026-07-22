"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/button";
import { adicionarExercicioAvulso } from "./actions";

/**
 * Form pra registrar um exercício fora do plano durante a sessão, já com a
 * primeira série. Segue o padrão Client form → Server Action, exibindo erro
 * amigável do servidor sem recarregar a página. Só deve ser renderizado com a
 * sessão EM_ANDAMENTO.
 */
export function AdicionarExercicioAvulsoForm({
  sessaoId,
}: {
  sessaoId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const resultado = await adicionarExercicioAvulso(formData);
      if ("error" in resultado) {
        setErro(resultado.error);
        return;
      }
      setErro(null);
      formRef.current?.reset();
    });
  }

  const inputClass =
    "rounded-card border border-black/[.08] bg-transparent px-4 py-3 text-black outline-none focus:border-black/40";

  return (
    <form ref={formRef} action={handleSubmit} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="sessaoId" value={sessaoId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          name="nome"
          placeholder="Nome do exercício"
          className={`${inputClass} min-w-0 flex-1`}
        />
        <input
          type="text"
          name="grupoMuscular"
          placeholder="Grupo muscular"
          className={`${inputClass} min-w-0 flex-1`}
        />
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          name="carga"
          min={0}
          step="0.5"
          placeholder="Carga (kg)"
          className={`${inputClass} min-w-0 flex-1`}
        />
        <input
          type="number"
          name="reps"
          min={1}
          placeholder="Reps"
          className={`${inputClass} min-w-0 flex-1`}
        />
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="disabled:opacity-50"
      >
        {isPending ? "Adicionando..." : "Adicionar exercício"}
      </Button>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </form>
  );
}
