import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type {
  ContentPageResponse,
  FaqInput,
  FaqListResponse,
  FaqMutationResponse,
  PageMutationResponse,
  UpdateFaqInput,
  UpdatePageInput,
} from '../contract';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  return (await response.json()) as T;
}

export interface ContentClient {
  page(slug: string): Promise<ContentPageResponse>;
  faqs(category?: string): Promise<FaqListResponse>;
  updatePage(slug: string, patch: UpdatePageInput): Promise<PageMutationResponse>;
  createFaq(input: FaqInput): Promise<FaqMutationResponse>;
  updateFaq(id: string, patch: UpdateFaqInput): Promise<FaqMutationResponse>;
  removeFaq(id: string): Promise<FaqMutationResponse>;
}

export function createContentClient(baseUrl = '/api/content'): ContentClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    page: (slug) => getJson<ContentPageResponse>(`${root}/pages/${encodeURIComponent(slug)}`),
    faqs: (category) => {
      const query = category ? `?category=${encodeURIComponent(category)}` : '';
      return getJson<FaqListResponse>(`${root}/faqs${query}`);
    },
    updatePage: async (slug, patch) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/pages/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return (await response.json()) as PageMutationResponse;
    },
    createFaq: async (input) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/faqs`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return (await response.json()) as FaqMutationResponse;
    },
    updateFaq: async (id, patch) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/faqs/${encodeURIComponent(id)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return (await response.json()) as FaqMutationResponse;
    },
    removeFaq: async (id) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/faqs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...csrfHeaders() },
      });
      return (await response.json()) as FaqMutationResponse;
    },
  };
}
