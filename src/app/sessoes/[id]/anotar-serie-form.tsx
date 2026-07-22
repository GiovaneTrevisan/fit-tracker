"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/button";
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
    "rounded-card border border-black/[.08] bg-transparent px-4 py-3 text-grande text-black outline-none focus:border-black/40";

  return (
    <form ref={formRef} action={handleSubmit} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="sessaoId" value={sessaoId} />
      <input type="hidden" name="exercicioId" value={exercicioId} />
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
        className="w-full disabled:opacity-50"
      >
        {isPending ? "Anotando..." : "Anotar série"}
      </Button>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </form>
  );
}
