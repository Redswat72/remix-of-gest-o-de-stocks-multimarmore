import { describe, it, expect } from 'vitest';
import { isBlocoDisponivel } from './blocoDisponivel';

describe('isBlocoDisponivel', () => {
  it('bloco ativo a 0 kg não aparece', () => expect(isBlocoDisponivel({ quantidade_kg: 0, ativo: true })).toBe(false));
  it('bloco sem peso (NULL) não aparece', () => expect(isBlocoDisponivel({ quantidade_kg: null, ativo: true })).toBe(false));
  it('peso negativo não aparece', () => expect(isBlocoDisponivel({ quantidade_kg: -5 })).toBe(false));
  it('inativo com peso não aparece', () => expect(isBlocoDisponivel({ quantidade_kg: 16450, ativo: false })).toBe(false));
  it('ativo com peso > 0 aparece', () => expect(isBlocoDisponivel({ quantidade_kg: 16450, ativo: true })).toBe(true));
  it('ativo nulo com peso aparece', () => expect(isBlocoDisponivel({ quantidade_kg: 1, ativo: null })).toBe(true));
});
