import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type {
  TestimonialInput,
  TestimonialListResponse,
  TestimonialMutationResponse,
  UpdateTestimonialInput,
} from '../contract';

export interface TestimonialsClient {
  list(): Promise<TestimonialListResponse>;
  create(input: TestimonialInput): Promise<TestimonialMutationResponse>;
  update(id: string, patch: UpdateTestimonialInput): Promise<TestimonialMutationResponse>;
  remove(id: string): Promise<TestimonialMutationResponse>;
}

export function createTestimonialsClient(baseUrl = '/api/testimonials'): TestimonialsClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    list: async () => {
      const response = await fetch(`${root}/`, { credentials: 'include' });
      return (await response.json()) as TestimonialListResponse;
    },
    create: async (input) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return (await response.json()) as TestimonialMutationResponse;
    },
    update: async (id, patch) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return (await response.json()) as TestimonialMutationResponse;
    },
    remove: async (id) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...csrfHeaders() },
      });
      return (await response.json()) as TestimonialMutationResponse;
    },
  };
}
