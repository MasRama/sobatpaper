import { z } from 'zod';

export const contentPageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  body: z.string(),
  updatedAt: z.number(),
});

export const faqSchema = z.object({
  id: z.string(),
  category: z.string(),
  question: z.string(),
  answer: z.string(),
});

export type ContentPage = z.infer<typeof contentPageSchema>;
export type Faq = z.infer<typeof faqSchema>;

export interface ContentSuccess<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface ContentError {
  success: false;
  message: string;
  code: string;
}

export type ContentPageResponse = ContentSuccess<{ page: ContentPage }> | ContentError;

export const updatePageInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  body: z.string().trim().min(1, 'Body is required').max(20000),
});

export type UpdatePageInput = z.infer<typeof updatePageInputSchema>;

export const faqInputSchema = z.object({
  category: z.string().trim().min(1, 'Category is required').max(80),
  question: z.string().trim().min(1, 'Question is required').max(500),
  answer: z.string().trim().min(1, 'Answer is required').max(5000),
  sortOrder: z.number().int().default(0),
});

export type FaqInput = z.infer<typeof faqInputSchema>;

export const updateFaqInputSchema = z
  .object({
    category: faqInputSchema.shape.category.optional(),
    question: faqInputSchema.shape.question.optional(),
    answer: faqInputSchema.shape.answer.optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Nothing to update',
  });

export type UpdateFaqInput = z.infer<typeof updateFaqInputSchema>;

export type PageMutationResponse = ContentSuccess<{ page: ContentPage }> | ContentError;
export type FaqMutationResponse = ContentSuccess<{ faq: Faq }> | ContentError;
export type FaqListResponse = ContentSuccess<{ faqs: Faq[] }> | ContentError;
