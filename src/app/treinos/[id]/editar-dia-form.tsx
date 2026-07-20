"use client";

import { useState, useTransition } from "react";
import { NOMES_DIAS } from "@/lib/dias-semana";
import { definirDiaTreino } from "./actions";

/**
 * Form pra alterar ou remover o dia da semana do treino. "Sem dia definido"
 * (value vazio) transforma o treino em avulso. Segue o padrão Client form →
 * Server Action, exibindo erro amigável do servidor sem recarregar a página.
 */
export function EditarDiaForm({
  treinoId,
  diaSemana,
}: {
  treinoId: string;
  diaSemana: number | null;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const resultado = await definirDiaTreino(formData);
      setErro("error" in resultado ? resultado.error : null);
    });
  }

  return (
    <form action={handleSubmit} className="mt-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor="diaSemana"
          className="text-sm text-zinc-600"
        >
          Dia da semana
        </label>
        <input type="hidden" name="treinoId" value={treinoId} />
        <select
          id="diaSemana"
          name="diaSemana"
          defaultValue={diaSemana === null ? "" : String(diaSemana)}
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
          className="rounded-lg border border-black/[.08] px-4 py-2 font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar dia"}
        </button>
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </form>
  );
}
