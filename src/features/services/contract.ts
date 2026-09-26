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

export const serviceFaqInputSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(500),
  answer: z.string().trim().min(1, 'Answer is required').max(2000),
});

export type ServiceFaqInput = z.infer<typeof serviceFaqInputSchema>;

const serviceFields = {
  name: z.string().trim().min(1, 'Name is required').max(120),
  tagline: z.string().trim().min(1, 'Tagline is required').max(200),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  scope: z.array(z.string().trim().min(1).max(300)).max(30),
  process: z.array(z.string().trim().min(1).max(300)).max(30),
  estimatedTime: z.string().trim().min(1, 'Estimated time is required').max(120),
  startingPrice: z.number().int().min(0),
  disclaimer: z.string().trim().max(1000).nullable().optional(),
  sortOrder: z.number().int().default(0),
};

export const createServiceInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens')
    .max(80),
  ...serviceFields,
  faqs: z.array(serviceFaqInputSchema).max(20).default([]),
});

export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;

export const updateServiceInputSchema = z
  .object({
    name: serviceFields.name.optional(),
    tagline: serviceFields.tagline.optional(),
    description: serviceFields.description.optional(),
    scope: serviceFields.scope.optional(),
    process: serviceFields.process.optional(),
    estimatedTime: serviceFields.estimatedTime.optional(),
    startingPrice: serviceFields.startingPrice.optional(),
    disclaimer: serviceFields.disclaimer,
    sortOrder: z.number().int().optional(),
    faqs: z.array(serviceFaqInputSchema).max(20).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Nothing to update',
  });

export type UpdateServiceInput = z.infer<typeof updateServiceInputSchema>;

export type ServiceMutationResponse = ServiceSuccess<{ service: ServiceDetail }> | ServiceError;
export type ServiceDetailResponse = ServiceSuccess<{ service: ServiceDetail }> | ServiceError;
