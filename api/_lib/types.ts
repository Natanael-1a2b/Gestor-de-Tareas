export interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
  query: Record<string, string | string[]>;
}

export interface VercelResponse {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => VercelResponse;
  json: (data: unknown) => void;
  end: () => void;
}

/**
 * Extrae un mensaje legible de cualquier error, incluyendo los objetos planos
 * que devuelve supabase-js (PostgrestError) que NO son instancias de Error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const details = 'details' in error && error.details ? ` (${error.details})` : '';
    const hint = 'hint' in error && error.hint ? ` — hint: ${error.hint}` : '';
    return `${String((error as { message: unknown }).message)}${details}${hint}`;
  }
  return 'Error interno del servidor';
}

export function setCorsHeaders(res: VercelResponse, methods: string): void {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}
