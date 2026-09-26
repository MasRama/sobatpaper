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


export const testimonialInputSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required').max(80),
  role: z.string().trim().min(1, 'Role is required').max(80),
  content: z.string().trim().min(1, 'Content is required').max(2000),
  sortOrder: z.number().int().default(0),
});

export type TestimonialInput = z.infer<typeof testimonialInputSchema>;

export const updateTestimonialInputSchema = z
  .object({
    displayName: testimonialInputSchema.shape.displayName.optional(),
    role: testimonialInputSchema.shape.role.optional(),
    content: testimonialInputSchema.shape.content.optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Nothing to update',
  });

export type UpdateTestimonialInput = z.infer<typeof updateTestimonialInputSchema>;

export type TestimonialMutationResponse = TestimonialSuccess<{ testimonial: Testimonial }> | TestimonialError;
export type TestimonialListResponse = TestimonialSuccess<{ testimonials: Testimonial[] }> | TestimonialError;
