"use client";

import { useRef, useState, useTransition } from "react";
import { adicionarExercicio } from "./actions";

export function AdicionarExercicioForm({ treinoId }: { treinoId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const resultado = await adicionarExercicio(formData);
      if ("error" in resultado) {
        setErro(resultado.error);
        return;
      }
      setErro(null);
      formRef.current?.reset();
    });
  }

  const inputClass =
    "rounded-lg border border-black/[.08] bg-transparent px-4 py-2 text-black outline-none focus:border-black/40 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/40";

  return (
    <form ref={formRef} action={handleSubmit} className="mt-8 flex flex-col gap-2">
      <input type="hidden" name="treinoId" value={treinoId} />
      <h2 className="text-lg font-medium text-black dark:text-zinc-50">
        Adicionar exercício
      </h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          name="nome"
          placeholder="Nome do exercício"
          className={`${inputClass} flex-1`}
        />
        <input
          type="text"
          name="grupoMuscular"
          placeholder="Grupo muscular"
          className={`${inputClass} flex-1`}
        />
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          name="seriesAlvo"
          min={1}
          placeholder="Séries alvo"
          className={`${inputClass} w-32`}
        />
        <input
          type="number"
          name="repsAlvo"
          min={1}
          placeholder="Reps alvo"
          className={`${inputClass} w-32`}
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {isPending ? "Adicionando..." : "Adicionar exercício"}
        </button>
      </div>
      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
    </form>
  );
}
