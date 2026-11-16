# Project architecture rules

- Use shared inventory dimension formatters for list and Excel output so block and slab measurements stay consistent across the application.- Distinguish our yards from external service providers via `locais.tipo` and the shared helpers in `src/lib/locais.ts` (ParqueBadge, ParqueFiltroSelect, export labels), so provider stock is never summed into yard totals.

- Block weight is persisted in kg (`blocos.quantidade_kg`) and shown/entered in tonnes only via `src/lib/blocoPeso.ts`, so stored data and integrations never change unit.

- Block visibility in stock/product/search/store/export uses `isBlocoDisponivel` (src/lib/blocoDisponivel.ts: kg > 0 and ativo not false), so consumed blocks stay in DB/history but never appear as stock.

- Production permissions per yard go through the pure `verificarPermissaoProducao` (src/lib/permissoesProducao.ts); MM001 additionally requires an explicit grant row in the Multimarmore `permissoes_producao_parque` table, so role alone never authorises it.
