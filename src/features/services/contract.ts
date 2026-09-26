import { z } from 'zod';

export const serviceFaqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const serviceSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  tagline: z.string(),
  startingPrice: z.number(),
  estimatedTime: z.string(),
});

export const serviceDetailSchema = serviceSummarySchema.extend({
  description: z.string(),
  scope: z.array(z.string()),
  process: z.array(z.string()),
  disclaimer: z.string().nullable(),
  faqs: z.array(serviceFaqSchema),
});

export type ServiceFaq = z.infer<typeof serviceFaqSchema>;
export type ServiceSummary = z.infer<typeof serviceSummarySchema>;
export type ServiceDetail = z.infer<typeof serviceDetailSchema>;

export interface ServiceSuccess<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface ServiceError {
  success: false;
  message: string;
  code: string;
}

export type ServicesListResponse = ServiceSuccess<{ services: ServiceSummary[] }> | ServiceError;
export type ServiceDetailResponse = ServiceSuccess<{ service: ServiceDetail }> | ServiceError;
