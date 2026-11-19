export function handleMandiRequest(
  request: Request,
  apiKey: string | undefined,
  fetcher?: typeof fetch,
  options?: { limit?: number },
): Promise<Response>;
