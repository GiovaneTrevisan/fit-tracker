import Link from "next/link";
import { Badge } from "@/components/badge";
import { estilosBotao } from "@/components/button";
import { Card } from "@/components/card";
import { Container } from "@/components/container";
import { Rotulo, Valor } from "@/components/tipografia";
import { tomConsistencia } from "@/lib/consistencia";
import { chaveDia, hojeEmSP } from "@/lib/data-sp";
import { NOMES_DIAS } from "@/lib/dias-semana";
import { getHeatmapAno, getStreak, getTotalTreinos } from "@/lib/estatisticas";
import { getSessaoEmAndamento } from "@/lib/sessoes";
import { getTreinoDeHoje } from "@/lib/treinos";
import { imagemDoTreino } from "@/lib/treino-imagem";

// Depende do dia atual (fuso SP), que muda à meia-noite: renderiza a cada
// request pra "Treino de Hoje" nunca ficar preso no dia do build.
export const dynamic = "force-dynamic";

const DIA_MS = 86_400_000;

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/** Linhas rotuladas no eixo Y: só Seg/Qua/Sex, como o GitHub, pra não poluir. */
const DIAS_ROTULADOS = [1, 3, 5];

const celulaBase = "h-3 w-3 rounded-sm";
const rotulo = "text-[10px] leading-3 text-zinc-500";

const tooltipBase =
  "pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] leading-4 font-medium text-zinc-50 shadow-sm group-hover:block";

/**
 * Colunas de cada ponta onde o tooltip ancora pela lateral em vez de centralizar:
 * centralizado, ele precisaria de ~100px pra cada lado da célula e vazaria pra
 * fora da área que rola (onde seria cortado, não empurrado).
 */
const COLUNAS_DE_BORDA = 7;

function ancoragem(coluna: number, semanas: number): string {
  if (coluna < COLUNAS_DE_BORDA) return "left-0";
  if (coluna >= semanas - COLUNAS_DE_BORDA) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

// As células são âncoras de meia-noite UTC representando o dia-calendário SP:
// formatar em UTC lê a data como ela é, sem o fuso do runtime deslocar o dia.
const dataLonga = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function textoTooltip(d: Date, qtd: number): string {
  const contagem =
    qtd === 0 ? "sem treino" : qtd === 1 ? "1 treino" : `${qtd} treinos`;
  return `${dataLonga.format(d)} — ${contagem}`;
}

/**
 * Células do ano em ordem de grade: do domingo <= 1º de janeiro até o sábado >=
 * 31 de dezembro, pra as colunas fecharem semanas inteiras. Dias fora do ano
 * viram null (célula invisível que só segura o alinhamento).
 */
function celulasDoAno(ano: number): (Date | null)[] {
  const primeiro = Date.UTC(ano, 0, 1);
  const ultimo = Date.UTC(ano, 11, 31);
  const inicio = primeiro - new Date(primeiro).getUTCDay() * DIA_MS;
  const fim = ultimo + (6 - new Date(ultimo).getUTCDay()) * DIA_MS;

  const celulas: (Date | null)[] = [];
  for (let t = inicio; t <= fim; t += DIA_MS) {
    const d = new Date(t);
    celulas.push(d.getUTCFullYear() === ano ? d : null);
  }
  return celulas;
}

/**
 * Rótulo de mês por coluna (semana): o nome aparece na coluna que contém o dia
 * 1º daquele mês; nas demais, null. Uma coluna = 7 células consecutivas, mesma
 * ordem em que a grade (grid-flow-col, 7 linhas) as consome.
 */
function rotulosDeMes(celulas: (Date | null)[]): (string | null)[] {
  const semanas = Math.ceil(celulas.length / 7);
  return Array.from({ length: semanas }, (_, w) => {
    const primeiroDoMes = celulas
      .slice(w * 7, w * 7 + 7)
      .find((d) => d !== null && d.getUTCDate() === 1);
    return primeiroDoMes ? MESES[primeiroDoMes.getUTCMonth()] : null;
  });
}

export default async function Home() {
  const { ano } = hojeEmSP();
  const [treinoDeHoje, sessaoEmAndamento, total, streak, heatmap] = await Promise.all([
    getTreinoDeHoje(),
    getSessaoEmAndamento(),
    getTotalTreinos(),
    getStreak(),
    getHeatmapAno(ano),
  ]);
  const celulas = celulasDoAno(ano);
  const imgHoje = treinoDeHoje ? imagemDoTreino(treinoDeHoje.nome) : null;
  const imgContinuar = sessaoEmAndamento
    ? imagemDoTreino(sessaoEmAndamento.treinoNome)
    : null;

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans">
      <main className="flex w-full flex-1 flex-col">
        <Container className="flex flex-1 flex-col gap-6 bg-white py-12">
          {sessaoEmAndamento ? (
            <Card variante="forte" imagem={imgContinuar} prioridade>
              <Rotulo tom="sobre-escuro">Continuar treino</Rotulo>
              <p className="mt-2 text-hero font-semibold">
                {sessaoEmAndamento.treinoNome}
              </p>
              <Link
                href={`/sessoes/${sessaoEmAndamento.id}`}
                className={`${estilosBotao.base} ${estilosBotao.primaria} mt-5`}
              >
                Continuar
              </Link>
            </Card>
          ) : (
            <Card variante="forte" imagem={imgHoje} prioridade>
              <Rotulo tom="sobre-escuro">Treino de Hoje</Rotulo>
              {treinoDeHoje ? (
                <>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="text-hero font-semibold">
                      {treinoDeHoje.nome}
                    </p>
                    <Badge variante="escuro">
                      {NOMES_DIAS[treinoDeHoje.diaSemana]}
                    </Badge>
                  </div>
                  <Link
                    href={`/treinos/${treinoDeHoje.id}`}
                    className={`${estilosBotao.base} ${estilosBotao.primaria} mt-5`}
                  >
                    Ver treino
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-hero font-semibold">
                  Descanso hoje
                </p>
              )}
            </Card>
          )}

          <Card>
            <Rotulo>Estatísticas</Rotulo>

            <div className="mt-4 flex gap-8">
              <div>
                <Valor>{total}</Valor>
                <Rotulo className="mt-1">
                  {total === 1 ? "treino feito" : "treinos feitos"}
                </Rotulo>
              </div>
              <div>
                <Valor>{streak}</Valor>
                <Rotulo className="mt-1">
                  {streak === 1 ? "treino em sequência" : "treinos em sequência"}
                </Rotulo>
              </div>
            </div>

            <div className="mt-6">
              <Rotulo>Consistência em {ano}</Rotulo>
              {/* Rótulos e grade moram no mesmo bloco que rola: no overflow-x
                  eles deslizam junto e nunca descolam das colunas.
                  O pt-5 não é estético: overflow-x-auto faz o overflow-y virar
                  auto, e o corte acontece na padding box — sem essa folga o
                  tooltip da primeira linha seria cortado no topo. Como ele cabe
                  dentro do padding, também não sobra nada pra rolar na vertical. */}
              <div className="mt-2 overflow-x-auto pt-5 pb-1">
                <div className="inline-block">
                  <div className="flex gap-1">
                    <div className="w-7 shrink-0" />
                    {rotulosDeMes(celulas).map((mes, w) => (
                      <div key={w} className="relative h-4 w-3 shrink-0">
                        {mes && (
                          <span className={`absolute left-0 top-0 ${rotulo}`}>
                            {mes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1">
                    <div className="grid w-7 shrink-0 grid-rows-7 gap-1">
                      {NOMES_DIAS.map((nome, i) => (
                        <div
                          key={i}
                          className={`flex h-3 items-center justify-end ${rotulo}`}
                        >
                          {DIAS_ROTULADOS.includes(i) ? nome.slice(0, 3) : ""}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-flow-col grid-rows-7 gap-1">
                      {celulas.map((d, i) => {
                        if (!d) return <div key={i} className={celulaBase} />;
                        const partes = {
                          ano: d.getUTCFullYear(),
                          mes: d.getUTCMonth() + 1,
                          dia: d.getUTCDate(),
                        };
                        const chave = chaveDia(partes);
                        const qtd = heatmap.get(chave) ?? 0;
                        return (
                          <div
                            key={i}
                            className={`group relative ${celulaBase} ${tomConsistencia(qtd)}`}
                          >
                            <span
                              className={`${tooltipBase} ${ancoragem(
                                Math.floor(i / 7),
                                celulas.length / 7,
                              )}`}
                            >
                              {textoTooltip(d, qtd)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </main>
    </div>
  );
}
