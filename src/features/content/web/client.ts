import type { ContentPageResponse, FaqListResponse } from '../contract';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  return (await response.json()) as T;
}

export interface ContentClient {
  page(slug: string): Promise<ContentPageResponse>;
  faqs(category?: string): Promise<FaqListResponse>;
}

export function createContentClient(baseUrl = '/api/content'): ContentClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    page: (slug) => getJson<ContentPageResponse>(`${root}/pages/${encodeURIComponent(slug)}`),
    faqs: (category) => {
      const query = category ? `?category=${encodeURIComponent(category)}` : '';
      return getJson<FaqListResponse>(`${root}/faqs${query}`);
    },
  };
}
