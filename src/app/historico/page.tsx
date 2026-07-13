import Link from "next/link";
import { getSessoesDoMes, hojeEmSP } from "@/lib/historico";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;

  // Mês visível: do query param (?mes=YYYY-MM, 1-indexado) ou mês atual (SP).
  const hoje = hojeEmSP();
  let ano = hoje.ano;
  let mes = hoje.mes;
  const match = mesParam?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const a = Number(match[1]);
    const m = Number(match[2]);
    if (m >= 1 && m <= 12) {
      ano = a;
      mes = m;
    }
  }

  const porDia = await getSessoesDoMes(ano, mes);

  // Montagem da grade (aritmética de calendário, independente de fuso).
  const primeiro = new Date(ano, mes - 1, 1);
  const oculto = primeiro.getDay(); // 0=Dom → nº de células vazias iniciais
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(oculto).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  const titulo = primeiro.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const tituloCap = titulo.charAt(0).toUpperCase() + titulo.slice(1);

  const mesAnterior = formatMes(mes === 1 ? ano - 1 : ano, mes === 1 ? 12 : mes - 1);
  const mesProximo = formatMes(mes === 12 ? ano + 1 : ano, mes === 12 ? 1 : mes + 1);
  const ehMesAtual = ano === hoje.ano && mes === hoje.mes;

  const cellBase = "min-h-[5rem] rounded-lg border p-2 text-sm";
  const cellNeutro = "border-black/[.08] dark:border-white/[.145]";
  const cellMarcado =
    "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Início
      </Link>

      <div className="mt-2 flex items-center justify-between gap-4">
        <Link
          href={`/historico?mes=${mesAnterior}`}
          className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          ◀ Anterior
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {tituloCap}
        </h1>
        <Link
          href={`/historico?mes=${mesProximo}`}
          className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Próximo ▶
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            {d}
          </div>
        ))}

        {celulas.map((dia, i) => {
          if (dia === null) return <div key={`vazio-${i}`} />;

          const sessoes = porDia.get(dia) ?? [];
          const ehHoje = ehMesAtual && dia === hoje.dia;
          const ring = ehHoje ? "ring-2 ring-blue-400 dark:ring-blue-500" : "";

          if (sessoes.length === 0) {
            return (
              <div key={dia} className={`${cellBase} ${cellNeutro} ${ring}`}>
                <span className="text-zinc-400 dark:text-zinc-600">{dia}</span>
              </div>
            );
          }

          if (sessoes.length === 1) {
            return (
              <Link
                key={dia}
                href={`/sessoes/${sessoes[0].id}`}
                className={`${cellBase} ${cellMarcado} ${ring} block transition-colors hover:bg-green-100 dark:hover:bg-green-900/40`}
              >
                <span className="font-medium text-black dark:text-zinc-50">
                  {dia}
                </span>
                <span className="mt-1 block truncate text-xs text-zinc-600 dark:text-zinc-400">
                  {sessoes[0].treinoNome}
                </span>
              </Link>
            );
          }

          return (
            <div key={dia} className={`${cellBase} ${cellMarcado} ${ring}`}>
              <span className="font-medium text-black dark:text-zinc-50">
                {dia}
              </span>
              <ul className="mt-1 flex flex-col gap-0.5">
                {sessoes.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/sessoes/${s.id}`}
                      className="block truncate text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {s.treinoNome}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </main>
  );
}
