import type { TestimonialListResponse } from '../contract';

export interface TestimonialsClient {
  list(): Promise<TestimonialListResponse>;
}

export function createTestimonialsClient(baseUrl = '/api/testimonials'): TestimonialsClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    list: async () => {
      const response = await fetch(`${root}/`, { credentials: 'include' });
      return (await response.json()) as TestimonialListResponse;
    },
  };
}
