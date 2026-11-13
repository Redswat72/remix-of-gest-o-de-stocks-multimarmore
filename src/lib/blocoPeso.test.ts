import { describe, it, expect } from 'vitest';
import { kgToTons, tonsToKg } from './blocoPeso';

describe('peso dos blocos (kg na BD, t na app)', () => {
  it('25000 kg = 25 t', () => expect(kgToTons(25000)).toBe(25));
  it('25 t = 25000 kg', () => expect(tonsToKg(25)).toBe(25000));
  it('precisão 0,001 t = 1 kg', () => expect(tonsToKg('0,001')).toBe(1));
  it('ida e volta preserva a massa', () => {
    for (const kg of [0, 1, 16450, 21400, 14960, 11900, 123457]) expect(tonsToKg(kgToTons(kg))).toBe(kg);
  });
  it('vazio continua vazio e zero continua zero', () => {
    expect(kgToTons(null)).toBeNull();
    expect(tonsToKg('')).toBeNull();
    expect(kgToTons(0)).toBe(0);
    expect(tonsToKg(0)).toBe(0);
  });
});

describe('lojas e exportação', () => {
  it('bloco de 16450 kg aparece como 16,45 t sem dividir duas vezes', () => {
    const t = kgToTons(16450);
    expect(t).toBe(16.45);
    expect(tonsToKg(t)).toBe(16450);
  });
});
