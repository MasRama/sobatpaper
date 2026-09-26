export { createOrdersClient, type OrdersClient } from './client';
export type {
  CreateOrderInput,
  CreateOrderResponse,
  Order,
  OrderDetail,
  OrderDetailResponse,
  OrderEvent,
  OrderStatus,
  OrdersListResponse,
  UpdateOrderInput,
  UpdateOrderResponse,
} from '../contract';
export {
  DOCUMENT_CONDITION_LABELS,
  DOCUMENT_CONDITIONS,
  ORDER_SERVICES,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
} from '../contract';
export { default as AdminOrderDetailPage } from './pages/AdminOrderDetailPage.vue';
export { default as AdminOrdersPage } from './pages/AdminOrdersPage.vue';
export { default as OrderPage } from './pages/OrderPage.vue';
