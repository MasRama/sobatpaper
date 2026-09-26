import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type { CreateOrderInput } from '../../orders/web';
import type {
  AdminLeadsQuery,
  ConvertLeadResponse,
  CreateLeadInput,
  CreateLeadResponse,
  LeadDetailResponse,
  LeadsListResponse,
  UpdateLeadInput,
  UpdateLeadResponse,
} from '../contract';

export interface LeadsClient {
  create(input: CreateLeadInput): Promise<CreateLeadResponse>;
  list(query?: Partial<AdminLeadsQuery>): Promise<LeadsListResponse>;
  detail(id: string): Promise<LeadDetailResponse>;
  update(id: string, patch: UpdateLeadInput): Promise<UpdateLeadResponse>;
  convert(id: string, order: CreateOrderInput): Promise<ConvertLeadResponse>;
}

function querySuffix(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.size > 0 ? `?${params.toString()}` : '';
}

export function createLeadsClient(baseUrl = '/api/leads'): LeadsClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    create: async (input) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return (await response.json()) as CreateLeadResponse;
    },
    list: async (query = {}) => {
      const response = await fetch(`${root}/${querySuffix(query)}`, { credentials: 'include' });
      return (await response.json()) as LeadsListResponse;
    },
    detail: async (id) => {
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, { credentials: 'include' });
      return (await response.json()) as LeadDetailResponse;
    },
    update: async (id, patch) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return (await response.json()) as UpdateLeadResponse;
    },
    convert: async (id, order) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}/convert`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      return (await response.json()) as ConvertLeadResponse;
    },
  };
}
