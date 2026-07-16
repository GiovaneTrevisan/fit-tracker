import Link from "next/link";
import { chaveDia, hojeEmSP } from "@/lib/data-sp";
import { getHeatmapAno, getStreak, getTotalTreinos } from "@/lib/estatisticas";
import { getTreinoDeHoje } from "@/lib/treinos";

// Depende do dia atual (fuso SP), que muda à meia-noite: renderiza a cada
// request pra "Treino de Hoje" nunca ficar preso no dia do build.
export const dynamic = "force-dynamic";

const DIA_MS = 86_400_000;

const celulaBase = "h-3 w-3 rounded-sm";
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

export default async function Home() {
  const { ano } = hojeEmSP();
  const [treinoDeHoje, total, streak, heatmap] = await Promise.all([
    getTreinoDeHoje(),
    getTotalTreinos(),
    getStreak(),
    getHeatmapAno(ano),
  ]);

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
            <div className="mt-2 overflow-x-auto">
              <div className="grid grid-flow-col grid-rows-7 gap-1">
                {celulasDoAno(ano).map((d, i) => {
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
        </section>
      </main>
    </div>
  );
}
