import type { PortfolioListResponse } from '../contract';

export interface PortfolioClient {
  list(category?: string): Promise<PortfolioListResponse>;
}

export function createPortfolioClient(baseUrl = '/api/portfolio'): PortfolioClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    list: async (category) => {
      const query = category ? `?category=${encodeURIComponent(category)}` : '';
      const response = await fetch(`${root}/${query}`, { credentials: 'include' });
      return (await response.json()) as PortfolioListResponse;
    },
  };
}
