import type { PricingListResponse } from '../contract';

export interface PricingClient {
  list(): Promise<PricingListResponse>;
}

export function createPricingClient(baseUrl = '/api/pricing'): PricingClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    list: async () => {
      const response = await fetch(`${root}/`, { credentials: 'include' });
      return (await response.json()) as PricingListResponse;
    },
  };
}
