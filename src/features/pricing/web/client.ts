import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type {
  CreatePackageInput,
  PricingListResponse,
  PricingPackageResponse,
  UpdatePackageInput,
} from '../contract';

export interface PricingClient {
  list(): Promise<PricingListResponse>;
  create(input: CreatePackageInput): Promise<PricingPackageResponse>;
  update(id: string, patch: UpdatePackageInput): Promise<PricingPackageResponse>;
  remove(id: string): Promise<PricingPackageResponse>;
}

export function createPricingClient(baseUrl = '/api/pricing'): PricingClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    list: async () => {
      const response = await fetch(`${root}/`, { credentials: 'include' });
      return (await response.json()) as PricingListResponse;
    },
    create: async (input) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return (await response.json()) as PricingPackageResponse;
    },
    update: async (id, patch) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return (await response.json()) as PricingPackageResponse;
    },
    remove: async (id) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...csrfHeaders() },
      });
      return (await response.json()) as PricingPackageResponse;
    },
  };
}
