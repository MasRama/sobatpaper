import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type { QuoteInput, QuoteResponse } from '../contract';

export interface EstimationClient {
  quote(input: QuoteInput): Promise<QuoteResponse>;
}

export function createEstimationClient(baseUrl = '/api/estimation'): EstimationClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    quote: async (input) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/quote`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return (await response.json()) as QuoteResponse;
    },
  };
}
