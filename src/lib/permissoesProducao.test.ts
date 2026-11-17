import { describe, it, expect } from 'vitest';
import { podeProduzirOp, temGrantMM001Chapas, ContextoPermissaoProducao } from './permissoesProducao';

const base: ContextoPermissaoProducao = { parqueBloco: 'MM001', isAdmin: false, isOperador: false, userLocalCodigo: null, temProducao: false, grantMM001Chapas: false };
const adminGrant = { ...base, isAdmin: true, grantMM001Chapas: true };
const filipe = { ...base, isOperador: true, userLocalCodigo: 'MM001', temProducao: true, grantMM001Chapas: true };

describe('produção MM001', () => {
  it('admin com grant (Vanessa/Ana) faz chapas', () => expect(podeProduzirOp(adminGrant, 'chapas')).toBe(true));
  it('admin com grant (Vanessa/Ana) divide blocos', () => expect(podeProduzirOp(adminGrant, 'blocos')).toBe(true));
  it('operador MM001 com tem_producao e grant (Filipe) faz chapas', () => expect(podeProduzirOp(filipe, 'chapas')).toBe(true));
  it('operador MM001 com tem_producao e grant (Filipe) divide blocos', () => expect(podeProduzirOp(filipe, 'blocos')).toBe(true));
  it('código de parque com parênteses [MM001] é reconhecido', () => expect(podeProduzirOp({ ...filipe, parqueBloco: '[MM001]', userLocalCodigo: '[MM001]' }, 'chapas')).toBe(true));
  it('outro admin sem grant é proibido', () => expect(podeProduzirOp({ ...adminGrant, grantMM001Chapas: false }, 'chapas')).toBe(false));
  it('operador MM001 sem grant é proibido', () => expect(podeProduzirOp({ ...filipe, grantMM001Chapas: false }, 'chapas')).toBe(false));
  it('operador com grant mas sem tem_producao é proibido', () => expect(podeProduzirOp({ ...filipe, temProducao: false }, 'chapas')).toBe(false));
  it('operador com grant mas de outro parque é proibido', () => expect(podeProduzirOp({ ...filipe, userLocalCodigo: 'MM002' }, 'chapas')).toBe(false));
});

describe('admin com grant produz em todos os parques', () => {
  it('MM002: chapas e blocos', () => {
    const c = { ...adminGrant, parqueBloco: 'MM002' };
    expect(podeProduzirOp(c, 'chapas')).toBe(true);
    expect(podeProduzirOp(c, 'blocos')).toBe(true);
  });
  it('MM003: chapas e blocos', () => {
    const c = { ...adminGrant, parqueBloco: 'MM003' };
    expect(podeProduzirOp(c, 'chapas')).toBe(true);
    expect(podeProduzirOp(c, 'blocos')).toBe(true);
  });
  it('MM004: chapas e blocos', () => {
    const c = { ...adminGrant, parqueBloco: 'MM004' };
    expect(podeProduzirOp(c, 'chapas')).toBe(true);
    expect(podeProduzirOp(c, 'blocos')).toBe(true);
  });
});

describe('Filipe (operador MM001) fora do MM001', () => {
  it('não produz em MM002', () => expect(podeProduzirOp({ ...filipe, parqueBloco: 'MM002' }, 'chapas')).toBe(false));
  it('não divide em MM002', () => expect(podeProduzirOp({ ...filipe, parqueBloco: 'MM002' }, 'blocos')).toBe(false));
  it('não produz em MM003', () => expect(podeProduzirOp({ ...filipe, parqueBloco: 'MM003' }, 'chapas')).toBe(false));
  it('não produz em MM004', () => expect(podeProduzirOp({ ...filipe, parqueBloco: 'MM004' }, 'chapas')).toBe(false));
});

describe('MM002 / MM003 / outros (regras base)', () => {
  const eduardo = { ...base, parqueBloco: 'MM002', isOperador: true, userLocalCodigo: 'MM002' };
  it('Eduardo (operador MM002) faz chapas e divisão', () => {
    expect(podeProduzirOp(eduardo, 'chapas')).toBe(true);
    expect(podeProduzirOp(eduardo, 'blocos')).toBe(true);
  });
  it('admin sem grant produz em MM002', () => expect(podeProduzirOp({ ...base, parqueBloco: 'MM002', isAdmin: true }, 'blocos')).toBe(true));
  it('admin sem grant em MM003: chapas sim, divisão não', () => {
    const c = { ...base, parqueBloco: 'MM003', isAdmin: true };
    expect(podeProduzirOp(c, 'chapas')).toBe(true);
    expect(podeProduzirOp(c, 'blocos')).toBe(false);
  });
  it('operador não produz em MM003', () => expect(podeProduzirOp({ ...base, parqueBloco: 'MM003', isOperador: true, userLocalCodigo: 'MM003' }, 'chapas')).toBe(false));
  it('admin sem grant não produz em MM004', () => expect(podeProduzirOp({ ...base, parqueBloco: 'MM004', isAdmin: true }, 'chapas')).toBe(false));
  it('temGrantMM001Chapas só aceita MM001/chapas', () => {
    expect(temGrantMM001Chapas([{ parque_codigo: 'MM001', operacao: 'chapas' }])).toBe(true);
    expect(temGrantMM001Chapas([{ parque_codigo: 'MM001', operacao: 'blocos' }])).toBe(false);
    expect(temGrantMM001Chapas([{ parque_codigo: 'MM002', operacao: 'chapas' }])).toBe(false);
    expect(temGrantMM001Chapas(undefined)).toBe(false);
  });
});
