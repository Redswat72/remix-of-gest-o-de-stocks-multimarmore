## Objetivo
Internacionalização PT/EN completa da app interna, reaproveitando a instância i18next existente (loja intocada). Seletor no header, persistência separada, formatação regional e tradução segura de enums (BD sempre em PT).

## 1. Arquitetura

Reaproveitar `src/i18n/index.ts`. Adicionar namespace `app`:

```text
src/i18n/
  index.ts             ← regista resources[lng].app
  pt.json … th.json    ← LOJA (intocados)
  app/pt.json          ← novo, app interna PT
  app/en.json          ← novo, app interna EN
```

Importação estática (mesma convenção da loja, sem `i18next-http-backend`).

## 2. Persistência separada (ponto crítico)

Instância i18next única. Chaves de localStorage separadas:
- App interna → `app-language`
- Loja → `store-language` (intocado)

Wrapper `src/lib/appLanguage.ts`:
```ts
export const setAppLanguage = (lng: 'pt'|'en') => {
  i18n.changeLanguage(lng);
  localStorage.setItem('app-language', lng);
};
export const getAppLanguage = (): 'pt'|'en' =>
  (localStorage.getItem('app-language') as 'pt'|'en') ?? 'pt';
```

Em `AppLayout` (rotas autenticadas), `useEffect` aplica `getAppLanguage()` ao montar.
Em `StoreLayout` (já existe), continua a aplicar `store-language`.

Resultado: cada contexto restaura o seu idioma ao entrar; sair de um não polui o outro.

## 3. Helpers

- `src/hooks/useAppT.ts` → `useTranslation('app').t`
- `src/lib/format.ts`:
  - `useLocale()` — `'en-GB'` ou `'pt-PT'`
  - `formatDate`, `formatDateTime`, `formatNumber(n, dec)`, `formatCurrency(n)`, `formatWeight(kg)`, `formatVolume(m3)`, `formatArea(m2)`
  - Substitui ocorrências de `toLocaleString('pt-PT')` / `Intl.NumberFormat('pt-PT')` na app interna.
- `src/lib/enumLabels.ts` — `useEnumLabel()` com fallback ao valor cru.
- `src/components/flags.tsx` — extrai `FlagPT` e `FlagGB` da `LanguageSelector` da loja para reutilização (loja continua a funcionar).
- `src/components/AppLanguageSelector.tsx` — botão PT|EN com bandeirinhas; integrado em `Header.tsx` (desktop + mobile), entre badge de local e botão de tema.

## 4. Árvore de chaves (`app/pt.json` / `app/en.json`)

Secções: `nav`, `header`, `auth`, `dashboard`, `inventory`, `products`, `stock`, `movements`, `production`, `import`, `audit`, `superadmin`, `profile`, `forms`, `actions`, `toasts`, `errors`, `empty`, `confirm`, `enums`.

Toda a árvore criada **antes** de traduzir componentes, para evitar inconsistências.

## 5. Mapas de enums (BD sempre PT, só apresentação)

`enumLabels.ts` com **chaves exatas da BD** (case-sensitive, atenção a `factura` com 'c' e `comercial` sem prefixo):

**`enums.tipoMovimento`**

| chave BD | PT | EN |
|---|---|---|
| `entrada` | Entrada | Inbound |
| `transferencia` | Transferência | Transfer |
| `saida` | Saída | **Dispatch** |

**`enums.tipoDocumento`**

| chave BD | PT | EN |
|---|---|---|
| `guia_transporte` | Guia de transporte | Delivery note |
| `guia_transferencia` | Guia de transferência | Transfer note |
| `factura` | Fatura | Invoice |
| `sem_documento` | Sem documento | No document |

**`enums.role`**

| chave BD | PT | EN |
|---|---|---|
| `superadmin` | Superadmin | Superadmin |
| `admin` | Admin | Admin |
| `user` | Utilizador | User |
| `comercial` | Comercial | Commercial |

**`enums.tipoProduto`**

| chave BD | PT | EN |
|---|---|---|
| `bloco` | Bloco | Block |
| `chapa` | Chapa | Slab |
| `ladrilho` | Ladrilho | Tile |
| `banda` | Banda | Strip |

**`enums.status`**

| chave BD | PT | EN |
|---|---|---|
| `ativo` | Ativo | Active |
| `inativo` | Inativo | Inactive |
| `pendente` | Pendente | Pending |
| `confirmado` | Confirmado | Confirmed |
| `corrigido` | Corrigido | Corrected |
| `aprovado` | Aprovado | Approved |
| `rejeitado` | Rejeitado | Rejected |

**`enums.company`**: `multimarmore`→Multimarmore, `magratex`→Magratex (iguais nos dois).

**Helper**:
```ts
export const useEnumLabel = () => {
  const t = useAppT();
  return (group, value?: string|null) => {
    if (!value) return '';
    const key = `enums.${group}.${value}`;
    const out = t(key);
    return out === key ? value : out; // fallback seguro
  };
};
```

**Regras invioláveis**:
1. Mapas só para apresentação. Em writes/filters/RPC: sempre valor cru da BD (ex.: insere `'saida'`, nunca `'Dispatch'`).
2. Comparações em código (`if (tipo === 'saida')`) continuam com valor cru.
3. Em `<Select>` de filtros: `value`=valor cru BD, label=traduzida.
4. Valor desconhecido → mostra valor cru, nunca vazio nem erro.

## 6. Glossário EN (consistência)

Inventário→Inventory, Bloco→Block, Chapa→Slab, Ladrilho→Tile, Banda→Strip, Parque→Yard, Movimento→Movement, Entrada→Inbound, **Saída→Dispatch** (sempre, nunca "Outbound"), Transferência→Transfer, Produção→Production, Fatura→Invoice, Guia de transporte→Delivery note, Guia de transferência→Transfer note, Pedreira→Quarry, Cliente→Customer, Fornecedor→Supplier, Acabamento→Finish, Variedade→Variety, Pesquisar→Search, Filtrar→Filter, Exportar→Export, Importar→Import, Guardar→Save, Eliminar→Delete, Editar→Edit, Registar→Register, Aprovar→Approve, Rejeitar→Reject, Confirmar→Confirm, Cancelar→Cancel, Voltar→Back.

## 7. Nunca traduzir (raw da BD)

Variedades de pedra, códigos de parque (MM001), IDs/IDMM, números de documento (FA.2026/34…), nomes próprios, emails, observações escritas pelo utilizador. Nenhuma destas passa por `t()`.

## 8. Faseamento

**Fase 1 — Infraestrutura (este turno)**
1. `src/i18n/app/pt.json` e `en.json` com árvore completa preenchida.
2. `src/i18n/index.ts` regista namespace `app`.
3. `useAppT`, `format.ts`, `enumLabels.ts`, `appLanguage.ts`.
4. `flags.tsx` + `AppLanguageSelector.tsx`.
5. Integra seletor em `Header.tsx`; controlador de idioma em `AppLayout`.

**Fase 2 — Aplicar traduções (subagentes paralelos)**

5 subagentes em paralelo, com glossário e regras do enum:
- **A**: `Login`, `AlterarPassword`, `SelecionarEmpresa`, `Perfil`, `Header`, `Sidebar`, `MobileNav`, `AppLayout`, `ProtectedRoute`.
- **B**: `Dashboard`, `Stock`, `Historico`, `Auditoria`.
- **C**: `Blocos`, `Chapas`, `Ladrilho`, `Bandas`, `InventarioFicha`, `ProdutoFicha`, `Produtos` + componentes em `inventario/` e `produtos/`.
- **D**: `NovoMovimento`, `Producao`, `ImportarInventario`, `ImportarStock` + componentes em `movimentos/`.
- **E**: `Superadmin`, `AddUserModal`, modais de confirmação, toasts globais + varrimento final.

Cada agente: adiciona chaves em falta nos JSON centrais, aplica `useEnumLabel` onde mostra enums, substitui formatadores por `format.ts`. Não toca em queries/RLS/edge functions/schema.

**Fase 3 — Verificação**
- Grep nas pastas alvo por padrões PT (`>[A-ZÁÉÍÓÚ][a-záéíóúçãõ]+<`, placeholders com acentos, toasts hardcoded).
- Teste manual do fluxo crítico: app EN → loja → voltar à app (cada contexto mantém o seu idioma).
- Lista de strings residuais para revisão.

## 9. Fora de âmbito (não toca)

- `src/pages/Loja.tsx`, `src/pages/ProdutoPublico.tsx`, `src/components/loja/**`
- `src/i18n/{pt,en,fr,de,es,vi,zh,ja,ar,th}.json`
- BD, RLS, edge functions, lógica de negócio
- Operação 100% frontend.

## 10. Memória a guardar no fim

- Enums BD sempre em PT em writes/filters; tradução apenas via `useEnumLabel` (com fallback ao cru). Valores exatos: `saida`/`factura`/`comercial`.
- App interna usa namespace `app` na instância i18next partilhada + chave `app-language` no localStorage; loja mantém `store-language`.
- "Saída" → "Dispatch" (nunca "Outbound") em todo o lado.
