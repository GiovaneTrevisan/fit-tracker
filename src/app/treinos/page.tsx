import { getTreinos } from "@/lib/treinos";
import { CriarTreinoForm } from "./criar-treino-form";

export default async function TreinosPage() {
  const treinos = await getTreinos();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Treinos
      </h1>

      <CriarTreinoForm />

      {treinos.length === 0 ? (
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">
          Nenhum treino ainda
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {treinos.map((treino) => (
            <li
              key={treino.id}
              className="flex items-center justify-between rounded-lg border border-black/[.08] px-4 py-3 dark:border-white/[.145]"
            >
              <span className="font-medium text-black dark:text-zinc-50">
                {treino.nome}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {treino.totalExercicios}{" "}
                {treino.totalExercicios === 1 ? "exercício" : "exercícios"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
