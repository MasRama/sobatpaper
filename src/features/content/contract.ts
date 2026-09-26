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
export type FaqListResponse = ContentSuccess<{ faqs: Faq[] }> | ContentError;
