import Link from "next/link";
import { chaveDia, hojeEmSP } from "@/lib/data-sp";
import { NOMES_DIAS } from "@/lib/dias-semana";
import { getHeatmapAno, getStreak, getTotalTreinos } from "@/lib/estatisticas";
import { getTreinoDeHoje } from "@/lib/treinos";

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
const rotulo = "text-[10px] leading-3 text-zinc-500 dark:text-zinc-400";
const tons = [
  "bg-black/[.06] dark:bg-white/[.10]",
  "bg-green-100 dark:bg-green-900/30",
  "bg-green-300 dark:bg-green-700/60",
  "bg-green-500 dark:bg-green-500",
];

function tomPara(qtd: number): string {
  return tons[Math.min(qtd, tons.length - 1)];
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
  const [treinoDeHoje, total, streak, heatmap] = await Promise.all([
    getTreinoDeHoje(),
    getTotalTreinos(),
    getStreak(),
    getHeatmapAno(ano),
  ]);
  const celulas = celulasDoAno(ano);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-6 bg-white px-6 py-12 dark:bg-black">
        <section className="w-full rounded-xl border border-black/[.08] p-6 dark:border-white/[.145]">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Treino de Hoje
          </h2>
          {treinoDeHoje ? (
            <Link
              href={`/treinos/${treinoDeHoje.id}`}
              className="mt-1 inline-block text-2xl font-semibold tracking-tight text-black hover:underline dark:text-zinc-50"
            >
              {treinoDeHoje.nome}
            </Link>
          ) : (
            <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-500 dark:text-zinc-400">
              Descanso hoje
            </p>
          )}
        </section>

        <section className="w-full rounded-xl border border-black/[.08] p-6 dark:border-white/[.145]">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Estatísticas
          </h2>

          <div className="mt-4 flex gap-8">
            <div>
              <p className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
                {total}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {total === 1 ? "treino feito" : "treinos feitos"}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
                {streak}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {streak === 1 ? "treino em sequência" : "treinos em sequência"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Consistência em {ano}
            </p>
            {/* Rótulos e grade moram no mesmo bloco que rola: no overflow-x
                eles deslizam junto e nunca descolam das colunas. */}
            <div className="mt-2 overflow-x-auto">
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
                          className={`${celulaBase} ${tomPara(qtd)}`}
                          title={`${partes.dia}/${partes.mes}/${partes.ano} — ${qtd} ${
                            qtd === 1 ? "treino" : "treinos"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
