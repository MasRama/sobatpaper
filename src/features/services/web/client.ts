import type { ServiceDetailResponse, ServicesListResponse } from '../contract';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  return (await response.json()) as T;
}

export interface ServicesClient {
  list(): Promise<ServicesListResponse>;
  detail(slug: string): Promise<ServiceDetailResponse>;
}

export function createServicesClient(baseUrl = '/api/services'): ServicesClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    list: () => getJson<ServicesListResponse>(`${root}/`),
    detail: (slug) => getJson<ServiceDetailResponse>(`${root}/${encodeURIComponent(slug)}`),
  };
}
