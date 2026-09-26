import { z } from 'zod';

export const EDUCATION_LEVELS = ['S1', 'S2', 'S3', 'lainnya'] as const;
export const ESTIMATION_SERVICES = [
  'skripsi',
  'tesis',
  'analisis-data',
  'editing-formatting',
  'konversi-jurnal',
  'artikel-ilmiah',
] as const;
export const ESTIMATION_METHODS = ['kuantitatif', 'kualitatif', 'mixed', 'rnd', 'sem-pls', 'lainnya'] as const;
export const JOURNAL_TARGETS = ['SINTA 6', 'SINTA 5', 'SINTA 4', 'SINTA 3'] as const;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const quoteInputSchema = z
  .object({
    educationLevel: z.enum(EDUCATION_LEVELS),
    serviceSlug: z.enum(ESTIMATION_SERVICES),
    field: z.string().trim().min(1, 'Field is required').max(200, 'Field must be at most 200 characters'),
    method: z.enum(ESTIMATION_METHODS),
    pages: z.number().int().min(0).max(2000),
    dataCount: z.number().int().min(0).max(1_000_000).optional().default(0),
    journalTarget: z.enum(JOURNAL_TARGETS).nullable().optional(),
    deadline: z
      .string()
      .regex(datePattern, 'Deadline must be YYYY-MM-DD')
      .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), {
        message: 'Deadline must be a valid date',
      }),
  })
  .superRefine((value, context) => {
    if ((value.serviceSlug === 'konversi-jurnal' || value.serviceSlug === 'artikel-ilmiah') && !value.journalTarget) {
      context.addIssue({ code: 'custom', path: ['journalTarget'], message: 'Journal target is required for this service' });
    }
  });

export type QuoteInput = z.infer<typeof quoteInputSchema>;

export interface QuoteResult {
  min: number;
  max: number;
  currency: 'IDR';
  factors: string[];
}

export interface EstimationSuccess<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface EstimationError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export type QuoteResponse = EstimationSuccess<QuoteResult> | EstimationError;
