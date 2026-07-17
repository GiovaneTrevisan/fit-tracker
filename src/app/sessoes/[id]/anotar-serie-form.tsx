"use client";

import { useRef, useState, useTransition } from "react";
import { adicionarSerie } from "./actions";

export function AnotarSerieForm({
  sessaoId,
  exercicioId,
}: {
  sessaoId: string;
  exercicioId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const resultado = await adicionarSerie(formData);
      if ("error" in resultado) {
        setErro(resultado.error);
        return;
      }
      setErro(null);
      formRef.current?.reset();
    });
  }

  const inputClass =
    "rounded-lg border border-black/[.08] bg-transparent px-4 py-2 text-black outline-none focus:border-black/40";

  return (
    <form ref={formRef} action={handleSubmit} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="sessaoId" value={sessaoId} />
      <input type="hidden" name="exercicioId" value={exercicioId} />
      <div className="flex gap-2">
        <input
          type="number"
          name="carga"
          min={0}
          step="0.5"
          placeholder="Carga (kg)"
          className={`${inputClass} w-32`}
        />
        <input
          type="number"
          name="reps"
          min={1}
          placeholder="Reps"
          className={`${inputClass} w-24`}
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50"
        >
          {isPending ? "Anotando..." : "Anotar série"}
        </button>
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </form>
  );
}
