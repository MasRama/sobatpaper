import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type {
  PortfolioItemInput,
  PortfolioListResponse,
  PortfolioMutationResponse,
  UpdatePortfolioItemInput,
} from '../contract';

export interface PortfolioClient {
  list(category?: string): Promise<PortfolioListResponse>;
  create(input: PortfolioItemInput): Promise<PortfolioMutationResponse>;
  update(id: string, patch: UpdatePortfolioItemInput): Promise<PortfolioMutationResponse>;
  remove(id: string): Promise<PortfolioMutationResponse>;
}

export function createPortfolioClient(baseUrl = '/api/portfolio'): PortfolioClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    list: async (category) => {
      const query = category ? `?category=${encodeURIComponent(category)}` : '';
      const response = await fetch(`${root}/${query}`, { credentials: 'include' });
      return (await response.json()) as PortfolioListResponse;
    },
    create: async (input) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return (await response.json()) as PortfolioMutationResponse;
    },
    update: async (id, patch) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return (await response.json()) as PortfolioMutationResponse;
    },
    remove: async (id) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...csrfHeaders() },
      });
      return (await response.json()) as PortfolioMutationResponse;
    },
  };
}
