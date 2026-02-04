import type { PostgrestError } from '@supabase/supabase-js';

function extractUnknownColumnFromPostgrestError(message?: string): string | null {
  if (!message) return null;

  // PostgREST schema cache error format:
  // "Could not find the 'foto1_hd_url' column of 'produtos' in the schema cache"
  const m1 = message.match(/Could not find the '([^']+)' column/i);
  if (m1?.[1]) return m1[1];

  // Postgres error format (rarely surfaced via postgrest):
  // "column \"foo\" of relation \"bar\" does not exist"
  const m2 = message.match(/column\s+"([^"]+)"\s+of\s+relation/i);
  if (m2?.[1]) return m2[1];

  return null;
}

function isUnknownColumnError(error: unknown): error is PostgrestError {
  return (
    !!error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as any).message === 'string' &&
    /Could not find the '.*' column.*schema cache/i.test((error as any).message)
  );
}

/**
 * Executes a PostgREST write operation and, when the backend reports an unknown column
 * (schema mismatch), removes the offending column and retries.
 */
export async function withSchemaSafeRetry<T>(
  payload: Record<string, unknown>,
  op: (data: Record<string, unknown>) => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: { maxRetries?: number } = {}
): Promise<{ data: T | null; error: PostgrestError | null; removedColumns: string[] }> {
  const maxRetries = options.maxRetries ?? 10;
  const working = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await op(working);
    if (!res.error) return { ...res, removedColumns };

    if (!isUnknownColumnError(res.error)) return { ...res, removedColumns };

    const unknown = extractUnknownColumnFromPostgrestError(res.error.message);
    if (!unknown) return { ...res, removedColumns };

    if (!(unknown in working)) return { ...res, removedColumns };

    delete working[unknown];
    removedColumns.push(unknown);
  }

  // Should never reach here because we return on each iteration.
  return { data: null, error: null as any, removedColumns };
}
