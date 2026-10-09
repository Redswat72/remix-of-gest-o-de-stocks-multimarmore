# Project architecture rules

- Use shared inventory dimension formatters for list and Excel output so block and slab measurements stay consistent across the application.- Distinguish our yards from external service providers via `locais.tipo` and the shared helpers in `src/lib/locais.ts` (ParqueBadge, ParqueFiltroSelect, export labels), so provider stock is never summed into yard totals.
