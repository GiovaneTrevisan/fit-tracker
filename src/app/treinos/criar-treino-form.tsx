"use client";

import { useRef, useState, useTransition } from "react";
import { NOMES_DIAS } from "@/lib/dias-semana";
import { criarTreino } from "./actions";

export function CriarTreinoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const resultado = await criarTreino(formData);
      if ("error" in resultado) {
        setErro(resultado.error);
        return;
      }
      setErro(null);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mt-6 flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          name="nome"
          placeholder="Nome do treino"
          className="flex-1 rounded-lg border border-black/[.08] bg-transparent px-4 py-2 text-black outline-none focus:border-black/40"
        />
        <select
          name="diaSemana"
          defaultValue=""
          className="rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-black outline-none focus:border-black/40"
        >
          <option value="">Sem dia definido</option>
          {NOMES_DIAS.map((nome, dia) => (
            <option key={dia} value={dia}>
              {nome}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50"
        >
          {isPending ? "Criando..." : "Criar treino"}
        </button>
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </form>
  );
}
