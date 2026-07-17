import Link from "next/link";
import { getTreinos } from "@/lib/treinos";
import { CriarTreinoForm } from "./criar-treino-form";
import { SeloDia } from "./selo-dia";

export default async function TreinosPage() {
  const treinos = await getTreinos();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-black">
        Treinos
      </h1>

      <CriarTreinoForm />

      {treinos.length === 0 ? (
        <p className="mt-6 text-zinc-600">
          Nenhum treino ainda
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {treinos.map((treino) => (
            <li key={treino.id}>
              <Link
                href={`/treinos/${treino.id}`}
                className="flex items-center justify-between rounded-lg border border-black/[.08] px-4 py-3 transition-colors hover:bg-black/[.04]"
              >
                <span className="flex items-center gap-2 font-medium text-black">
                  {treino.nome}
                  <SeloDia diaSemana={treino.diaSemana} />
                </span>
                <span className="text-sm text-zinc-600">
                  {treino.totalExercicios}{" "}
                  {treino.totalExercicios === 1 ? "exercício" : "exercícios"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
