import Link from "next/link";
import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { Container } from "@/components/container";
import { Rotulo } from "@/components/tipografia";
import { NOMES_DIAS } from "@/lib/dias-semana";
import { getTreinosDaSemana } from "@/lib/treinos";
import { imagemDoTreino } from "@/lib/treino-imagem";
import { CriarTreinoForm } from "./criar-treino-form";

function contagem(n: number): string {
  return `${n} ${n === 1 ? "exercício" : "exercícios"}`;
}

export default async function TreinosPage() {
  const { porDia, avulsos } = await getTreinosDaSemana();

  return (
    <main className="py-12">
      <Container>
        <h1 className="text-titulo font-semibold text-forte">
          Treinos
        </h1>

        <CriarTreinoForm />

        <div className="mt-8 flex flex-col gap-3">
          {NOMES_DIAS.map((nomeDia, dia) => {
            const treinosDoDia = porDia[dia];

            if (treinosDoDia.length === 0) {
              return (
                <Card key={dia} className="flex items-center gap-3">
                  <Badge>{nomeDia}</Badge>
                  <span className="text-texto-suave">Descanso</span>
                </Card>
              );
            }

            return treinosDoDia.map((treino) => (
              <Link
                key={treino.id}
                href={`/treinos/${treino.id}`}
                className="block"
              >
                <Card variante="forte" imagem={imagemDoTreino(treino.nome)}>
                  <Badge variante="escuro">{nomeDia}</Badge>
                  <p className="mt-3 text-titulo font-semibold">
                    {treino.nome}
                  </p>
                  <div className="mt-2">
                    <Badge variante="escuro">
                      {contagem(treino.totalExercicios)}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ));
          })}
        </div>

        {avulsos.length > 0 && (
          <div className="mt-8 flex flex-col gap-3">
            <Rotulo>Sem dia</Rotulo>
            {avulsos.map((treino) => (
              <Link
                key={treino.id}
                href={`/treinos/${treino.id}`}
                className="block"
              >
                <Card variante="forte" imagem={imagemDoTreino(treino.nome)}>
                  <p className="text-titulo font-semibold">
                    {treino.nome}
                  </p>
                  <div className="mt-2">
                    <Badge variante="escuro">
                      {contagem(treino.totalExercicios)}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
