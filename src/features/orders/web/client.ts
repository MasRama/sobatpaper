import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type {
  AdminOrdersQuery,
  CreateOrderPaymentInput,
  CreateOrderPaymentResponse,
  CreateOrderInput,
  CreateOrderResponse,
  DeleteOrderFinalFileResponse,
  DeleteOrderPaymentResponse,
  OrderDetailResponse,
  OrdersListResponse,
  UploadOrderFinalFileResponse,
  UpdateOrderInput,
  UpdateOrderResponse,
} from '../contract';

export interface OrdersClient {
  create(input: CreateOrderInput): Promise<CreateOrderResponse>;
  list(query?: Partial<AdminOrdersQuery>): Promise<OrdersListResponse>;
  detail(id: string): Promise<OrderDetailResponse>;
  update(id: string, patch: UpdateOrderInput): Promise<UpdateOrderResponse>;
  createPayment(id: string, input: CreateOrderPaymentInput): Promise<CreateOrderPaymentResponse>;
  deletePayment(id: string, paymentId: string): Promise<DeleteOrderPaymentResponse>;
  uploadFinalFile(id: string, file: File): Promise<UploadOrderFinalFileResponse>;
  deleteFinalFile(id: string, fileId: string): Promise<DeleteOrderFinalFileResponse>;
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
    createPayment: async (id, input) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}/payments`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return (await response.json()) as CreateOrderPaymentResponse;
    },
    deletePayment: async (id, paymentId) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}/payments/${encodeURIComponent(paymentId)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...csrfHeaders() },
      });
      return (await response.json()) as DeleteOrderPaymentResponse;
    },
    uploadFinalFile: async (id, file) => {
      await ensureCsrfToken();
      const form = new FormData();
      form.set('file', file);
      const response = await fetch(`${root}/${encodeURIComponent(id)}/final-files`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...csrfHeaders() },
        body: form,
      });
      return (await response.json()) as UploadOrderFinalFileResponse;
    },
    deleteFinalFile: async (id, fileId) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}/final-files/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...csrfHeaders() },
      });
      return (await response.json()) as DeleteOrderFinalFileResponse;
    },
  };
}
