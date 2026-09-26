import { z } from 'zod';
import type { Order } from '../orders';
import { personNameSchema } from '../../shared/security/input';

export const LEAD_STATUSES = ['baru', 'dihubungi', 'qualified', 'cold', 'converted'] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  baru: 'Baru',
  dihubungi: 'Dihubungi',
  qualified: 'Qualified',
  cold: 'Cold',
  converted: 'Converted',
};

export const createLeadInputSchema = z.object({
  name: personNameSchema,
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{9,16}$/, 'WhatsApp number must be 9–16 digits'),
  need: z.string().trim().min(1, 'Need is required').max(2000),
  serviceSlug: z.string().trim().min(1).max(80).nullable().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;

export const leadSchema = z.object({
  id: z.string(),
  name: z.string(),
  whatsapp: z.string(),
  need: z.string(),
  serviceSlug: z.string().nullable(),
  status: z.enum(LEAD_STATUSES),
  convertedOrderId: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Lead = z.infer<typeof leadSchema>;

export const adminLeadsQuerySchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  serviceSlug: z.string().min(1).optional(),
  search: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AdminLeadsQuery = z.infer<typeof adminLeadsQuerySchema>;

export const updateLeadInputSchema = z
  .object({
    status: z.enum(['baru', 'dihubungi', 'qualified', 'cold']).optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((value) => value.status !== undefined || value.notes !== undefined, {
    message: 'Nothing to update',
  });

export type UpdateLeadInput = z.infer<typeof updateLeadInputSchema>;

export interface LeadSuccess<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface LeadError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export type CreateLeadResponse = LeadSuccess<{ lead: Lead }> | LeadError;
export type LeadsListResponse = LeadSuccess<{ leads: Lead[]; total: number }> | LeadError;
export type LeadDetailResponse = LeadSuccess<{ lead: Lead }> | LeadError;
export type UpdateLeadResponse = LeadSuccess<{ lead: Lead }> | LeadError;
export type ConvertLeadResponse = LeadSuccess<{ lead: Lead; order: Order }> | LeadError;
