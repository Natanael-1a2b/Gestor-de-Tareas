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

export function setCorsHeaders(res: VercelResponse, methods: string): void {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}
