export { createServicesClient, type ServicesClient } from './client';
export type { ServiceDetail, ServiceFaq, ServiceSummary } from '../contract';
export { formatIDR } from './format';
export { default as ServiceDetailPage } from './pages/ServiceDetailPage.vue';
export { default as ServicesPage } from './pages/ServicesPage.vue';
export type { CreateServiceInput, ServiceMutationResponse, UpdateServiceInput } from '../contract';
export { default as AdminServicesPage } from './pages/AdminServicesPage.vue';
