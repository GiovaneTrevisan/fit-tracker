import Link from "next/link";
import { estilosBotao } from "@/components/button";
import { Card } from "@/components/card";
import { Container } from "@/components/container";
import { Rotulo } from "@/components/tipografia";
import { tomConsistencia } from "@/lib/consistencia";
import { chaveDia, hojeEmSP, horaMinutoSP } from "@/lib/data-sp";
import { getSessoesDoMes } from "@/lib/historico";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; dia?: string }>;
}) {
  const { mes: mesParam, dia: diaParam } = await searchParams;

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

  const mesVisivel = formatMes(ano, mes);
  const mesAnterior = formatMes(mes === 1 ? ano - 1 : ano, mes === 1 ? 12 : mes - 1);
  const mesProximo = formatMes(mes === 12 ? ano + 1 : ano, mes === 12 ? 1 : mes + 1);
  const mesDeHoje = formatMes(hoje.ano, hoje.mes);
  const ehMesAtual = ano === hoje.ano && mes === hoje.mes;

  // Painel do dia (?dia=YYYY-MM-DD): só quando pertence ao mês visível.
  let diaSelecionado: number | null = null;
  const mDia = diaParam?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (mDia) {
    const a = Number(mDia[1]);
    const m = Number(mDia[2]);
    const d = Number(mDia[3]);
    if (a === ano && m === mes && d >= 1 && d <= diasNoMes) {
      diaSelecionado = d;
    }
  }
  const sessoesDoDia = diaSelecionado ? (porDia.get(diaSelecionado) ?? []) : [];
  const dataDoDia = diaSelecionado
    ? new Date(ano, mes - 1, diaSelecionado).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  const navBotao = `${estilosBotao.base} ${estilosBotao.contorno}`;
  const cellBase =
    "flex min-h-[3.25rem] items-start rounded-chip p-2 text-rotulo transition";

  return (
    <main className="py-12">
      <Container>
        <Link href="/" className="text-rotulo text-texto-suave hover:underline">
          ← Início
        </Link>

        <h1 className="mt-2 text-titulo font-semibold text-forte">{tituloCap}</h1>

        <div className="mt-4 flex items-center gap-2">
          <Link href={`/historico?mes=${mesAnterior}`} aria-label="Mês anterior" className={navBotao}>
            ◀
          </Link>
          <Link href={`/historico?mes=${mesProximo}`} aria-label="Próximo mês" className={navBotao}>
            ▶
          </Link>
          <Link href={`/historico?mes=${mesDeHoje}`} className={`${navBotao} ml-auto`}>
            Hoje
          </Link>
        </div>

        {/* Full-width: as 7 colunas cabem em ~380px. O overflow-x-auto é só rede
            de segurança pra telas ultra-estreitas — sem min-width que force rolagem. */}
        <div className="mt-6 overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 p-1">
            {DIAS_SEMANA.map((d) => (
              <Rotulo key={d} className="pb-1 text-center">
                {d}
              </Rotulo>
            ))}

            {celulas.map((dia, i) => {
              if (dia === null) return <div key={`vazio-${i}`} />;

              const sessoes = porDia.get(dia) ?? [];
              const ehHoje = ehMesAtual && dia === hoje.dia;
              const ehSelecionado = dia === diaSelecionado;
              const ring = ehSelecionado
                ? "ring-2 ring-forte ring-offset-2 ring-offset-superficie"
                : ehHoje
                  ? "ring-2 ring-primaria ring-offset-2 ring-offset-superficie"
                  : "";

              if (sessoes.length === 0) {
                return (
                  <div
                    key={dia}
                    className={`${cellBase} border border-black/[.06] text-texto-suave ${ring}`}
                  >
                    {dia}
                  </div>
                );
              }

              // Cor por intensidade (mesma escala do heatmap). Número sobre a cor:
              // claro nas intensidades baixas, branco na mais forte (3+).
              const bg = tomConsistencia(sessoes.length);
              const textoCor = sessoes.length >= 3 ? "text-white" : "text-forte";
              // 1 sessão vai direto; 2+ abre o painel do dia via URL.
              const href =
                sessoes.length === 1
                  ? `/sessoes/${sessoes[0].id}`
                  : `/historico?mes=${mesVisivel}&dia=${chaveDia({ ano, mes, dia })}`;

              return (
                <Link
                  key={dia}
                  href={href}
                  className={`${cellBase} ${bg} ${textoCor} ${ring} font-semibold hover:opacity-90`}
                >
                  {dia}
                </Link>
              );
            })}
          </div>
        </div>

        {diaSelecionado && sessoesDoDia.length > 0 && (
          <Card className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <Rotulo>{dataDoDia}</Rotulo>
              <Link
                href={`/historico?mes=${mesVisivel}`}
                className="text-rotulo text-texto-suave hover:underline"
              >
                Fechar
              </Link>
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {sessoesDoDia.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/sessoes/${s.id}`}
                    className="flex items-center justify-between gap-4 rounded-card border border-black/[.08] px-4 py-3 transition-colors hover:bg-black/[.04]"
                  >
                    <span className="text-grande font-semibold text-forte">
                      {s.treinoNome}
                    </span>
                    <span className="text-rotulo text-texto-suave">
                      {horaMinutoSP(s.data)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Container>
    </main>
  );
}
