/**
 * Dimensões de chapas: os dados podem estar em dois sítios diferentes na tabela `chapas`:
 *  - Campos das pargas: pargaN_comprimento / pargaN_altura / pargaN_espessura
 *  - Campos diretos: largura / altura (fallback)
 * Esta função devolve sempre a informação disponível, no formato C×A×E cm.
 */

type AnyChapa = Record<string, unknown>;

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function fmt(n: number): string {
  return String(Math.round(n * 100) / 100).replace('.', ',');
}

export interface DimensaoParga {
  comprimento: number | null;
  altura: number | null;
  espessura: number | null;
  quantidade: number | null;
  label: string;
}

export function getDimensoesPargas(chapa: AnyChapa): DimensaoParga[] {
  const out: DimensaoParga[] = [];
  for (let i = 1; i <= 4; i++) {
    const comprimento = num(chapa[`parga${i}_comprimento`]);
    const altura = num(chapa[`parga${i}_altura`]);
    const espessura = num(chapa[`parga${i}_espessura`]);
    const quantidade = num(chapa[`parga${i}_quantidade`]);
    if (comprimento == null && altura == null && espessura == null) continue;
    const partes = [comprimento, altura, espessura].filter(v => v != null) as number[];
    let label = partes.map(fmt).join('×');
    if (label) label += ' cm';
    if (quantidade) label += ` (${quantidade}un)`;
    out.push({ comprimento, altura, espessura, quantidade, label });
  }
  return out;
}

/** Texto único com todas as dimensões da chapa (pargas ou, em fallback, largura/altura). */
export function formatChapaDimensoes(chapa: AnyChapa | null | undefined): string {
  if (!chapa) return '';

  const pargas = getDimensoesPargas(chapa);
  if (pargas.length > 0) {
    return pargas.map(p => p.label).filter(Boolean).join('; ');
  }

  const largura = num(chapa.largura);
  const altura = num(chapa.altura);
  const espessura = num((chapa as AnyChapa).espessura);
  const partes = [largura, altura, espessura].filter(v => v != null) as number[];
  if (partes.length === 0) return '';
  return `${partes.map(fmt).join('×')} cm`;
}
