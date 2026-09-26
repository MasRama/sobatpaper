import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type {
  CreateServiceInput,
  ServiceDetailResponse,
  ServiceMutationResponse,
  ServicesListResponse,
  UpdateServiceInput,
} from '../contract';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  return (await response.json()) as T;
}

export interface ServicesClient {
  list(): Promise<ServicesListResponse>;
  detail(slug: string): Promise<ServiceDetailResponse>;
  create(input: CreateServiceInput): Promise<ServiceMutationResponse>;
  update(id: string, patch: UpdateServiceInput): Promise<ServiceMutationResponse>;
  remove(id: string): Promise<ServiceMutationResponse>;
}

export function createServicesClient(baseUrl = '/api/services'): ServicesClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    list: () => getJson<ServicesListResponse>(`${root}/`),
    detail: (slug) => getJson<ServiceDetailResponse>(`${root}/${encodeURIComponent(slug)}`),
    create: async (input) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return (await response.json()) as ServiceMutationResponse;
    },
    update: async (id, patch) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return (await response.json()) as ServiceMutationResponse;
    },
    remove: async (id) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...csrfHeaders() },
      });
      return (await response.json()) as ServiceMutationResponse;
    },
  };
}
