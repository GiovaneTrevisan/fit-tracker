import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Container } from "@/components/container";
import { getTreino } from "@/lib/treinos";
import { imagemDoTreino } from "@/lib/treino-imagem";
import { iniciarSessao } from "@/app/sessoes/actions";
import { AdicionarExercicioForm } from "./adicionar-exercicio-form";
import { EditarDiaForm } from "./editar-dia-form";
import { DeletarTreinoForm } from "./deletar-treino-form";
import { SeloDia } from "../selo-dia";
import { removerExercicio } from "./actions";

export default async function TreinoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const treino = await getTreino(id);

  if (!treino) notFound();

  const arquivado = treino.arquivado;

  async function removerAction(formData: FormData) {
    "use server";
    await removerExercicio(formData);
  }

  async function iniciarAction(formData: FormData) {
    "use server";
    await iniciarSessao(String(formData.get("treinoId") ?? ""));
  }

  return (
    <main className="py-12">
      <Container>
        <Link
          href="/treinos"
          className="text-rotulo text-texto-suave hover:underline"
        >
          ← Treinos
        </Link>

        <Card
          variante="forte"
          imagem={imagemDoTreino(treino.nome)}
          className="mt-2"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-titulo font-semibold">{treino.nome}</h1>
            <SeloDia diaSemana={treino.diaSemana} variante="escuro" />
            {arquivado && <Badge variante="escuro">Arquivado</Badge>}
          </div>
        </Card>

        {!arquivado && (
          <>
            <EditarDiaForm treinoId={treino.id} diaSemana={treino.diaSemana} />

            <form action={iniciarAction} className="mt-4">
              <input type="hidden" name="treinoId" value={treino.id} />
              <Button type="submit">Iniciar treino</Button>
            </form>
          </>
        )}

        {treino.exercicios.length === 0 ? (
          <Card variante="superficie" className="mt-6">
            <p className="text-texto-suave">Nenhum exercício ainda</p>
          </Card>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {treino.exercicios.map((ex) => {
              const reps =
                ex.repsAlvoMin === ex.repsAlvoMax
                  ? `${ex.repsAlvoMin}`
                  : `${ex.repsAlvoMin}–${ex.repsAlvoMax}`;
              return (
                <li
                  key={ex.treinoExercicioId}
                  className="flex items-center justify-between gap-4 rounded-card border border-black/[.08] bg-superficie px-4 py-3"
                >
                  <div>
                    <p className="text-grande font-semibold text-forte">
                      {ex.nome}
                    </p>
                    <p className="text-rotulo text-texto-suave">
                      {ex.grupoMuscular}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge>{ex.seriesAlvo} séries</Badge>
                      <Badge>{reps} reps</Badge>
                    </div>
                  </div>
                  {!arquivado && (
                    <form action={removerAction}>
                      <input
                        type="hidden"
                        name="treinoExercicioId"
                        value={ex.treinoExercicioId}
                      />
                      <input type="hidden" name="treinoId" value={treino.id} />
                      <button
                        type="submit"
                        className="text-rotulo text-texto-suave transition-colors hover:text-red-600"
                      >
                        Remover
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!arquivado && (
          <>
            <AdicionarExercicioForm treinoId={treino.id} />
            <DeletarTreinoForm treinoId={treino.id} />
          </>
        )}
      </Container>
    </main>
  );
}
