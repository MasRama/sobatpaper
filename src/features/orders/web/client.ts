import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type { CreateOrderInput, CreateOrderResponse } from '../contract';

export interface OrdersClient {
  create(input: CreateOrderInput): Promise<CreateOrderResponse>;
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
  };
}
