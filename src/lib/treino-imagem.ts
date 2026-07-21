/**
 * Vínculo treino → imagem de fundo por convenção de arquivo (sem acesso a
 * banco): o nome do treino é "slugificado" e casado contra os arquivos em
 * public/treinos/. Módulo puro — sem Prisma — pra poder ser importado tanto por
 * Server quanto por Client Components sem arrastar o Prisma pro bundle do
 * cliente. Mesmo padrão de dias-semana.ts.
 */

/**
 * Slugs das imagens que existem em public/treinos/ (arquivo `${slug}.webp`).
 * Fonte única de verdade: ao adicionar uma imagem nova, some o slug aqui.
 */
const IMAGENS = new Set(["superior", "inferior", "superior2", "inferior2"]);

/**
 * Normaliza o nome do treino pra casar com o nome do arquivo: tira acentos,
 * caixa e tudo que não for letra/número (espaços incluídos). Ex.: "Superior 2"
 * → "superior2", "Inferior" → "inferior".
 */
export function slugTreino(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove os diacríticos separados pelo NFD
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Caminho da imagem de fundo do treino, ou `null` quando não há arquivo
 * correspondente (fallback: o card usa o preto liso, sem quebrar).
 */
export function imagemDoTreino(nome: string): string | null {
  const slug = slugTreino(nome);
  return IMAGENS.has(slug) ? `/treinos/${slug}.webp` : null;
}
