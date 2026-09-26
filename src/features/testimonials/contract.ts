import { z } from 'zod';

export const testimonialSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  role: z.string(),
  content: z.string(),
});

export type Testimonial = z.infer<typeof testimonialSchema>;

export interface TestimonialSuccess<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface TestimonialError {
  success: false;
  message: string;
  code: string;
}

export type TestimonialListResponse = TestimonialSuccess<{ testimonials: Testimonial[] }> | TestimonialError;
