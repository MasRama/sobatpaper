import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type {
  AdminOrdersQuery,
  CreateOrderInput,
  CreateOrderResponse,
  OrderDetailResponse,
  OrdersListResponse,
  UpdateOrderInput,
  UpdateOrderResponse,
} from '../contract';

export interface OrdersClient {
  create(input: CreateOrderInput): Promise<CreateOrderResponse>;
  list(query?: Partial<AdminOrdersQuery>): Promise<OrdersListResponse>;
  detail(id: string): Promise<OrderDetailResponse>;
  update(id: string, patch: UpdateOrderInput): Promise<UpdateOrderResponse>;
}

export function createOrdersClient(baseUrl = '/api/orders'): OrdersClient {
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
      return (await response.json()) as CreateOrderResponse;
    },
    list: async (query = {}) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== '') params.set(key, String(value));
      }
      const suffix = params.size > 0 ? `?${params.toString()}` : '';
      const response = await fetch(`${root}/${suffix}`, { credentials: 'include' });
      return (await response.json()) as OrdersListResponse;
    },
    detail: async (id) => {
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, { credentials: 'include' });
      return (await response.json()) as OrderDetailResponse;
    },
    update: async (id, patch) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return (await response.json()) as UpdateOrderResponse;
    },
  };
}
