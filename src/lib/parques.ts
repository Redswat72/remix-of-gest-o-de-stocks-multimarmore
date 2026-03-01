export const PARQUES = {
  MM001: 'Sede — Bencatel',
  MM002: 'Plurirochas — Vila Viçosa',
  MM003: 'MTX — Borba',
  MM004: 'Mol',
  MM005: 'Estremoz',
  MM006: 'Olival do Pires',
} as const;

export type ParqueCode = keyof typeof PARQUES;

export const PARQUES_OPTIONS = Object.entries(PARQUES).map(([code, nome]) => ({
  value: code,
  label: `${code} — ${nome}`,
}));
