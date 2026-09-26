import { z } from 'zod';
import { personNameSchema } from '../../shared/security/input';

export const ORDER_STATUSES = [
  'lead',
  'konsultasi',
  'menunggu_dokumen',
  'analisis_scope',
  'menunggu_pembayaran',
  'paid',
  'assigned',
  'dalam_pengerjaan',
  'review',
  'revisi',
  'final',
  'completed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  lead: 'Lead',
  konsultasi: 'Konsultasi',
  menunggu_dokumen: 'Menunggu Dokumen',
  analisis_scope: 'Analisis Scope',
  menunggu_pembayaran: 'Menunggu Pembayaran',
  paid: 'Paid',
  assigned: 'Assigned',
  dalam_pengerjaan: 'Dalam Pengerjaan',
  review: 'Review',
  revisi: 'Revisi',
  final: 'Final',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ORDER_SERVICES = [
  'skripsi',
  'tesis',
  'analisis-data',
  'editing-formatting',
  'konversi-jurnal',
  'artikel-ilmiah',
] as const;

export const DOCUMENT_CONDITIONS = ['belum_ada_naskah', 'draf', 'lengkap', 'perlu_revisi'] as const;

export const DOCUMENT_CONDITION_LABELS: Record<(typeof DOCUMENT_CONDITIONS)[number], string> = {
  belum_ada_naskah: 'Belum ada naskah',
  draf: 'Draf awal',
  lengkap: 'Dokumen lengkap',
  perlu_revisi: 'Perlu revisi',
};

function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const createOrderInputSchema = z.object({
  serviceSlug: z.enum(ORDER_SERVICES),
  packageName: z.string().trim().max(200).nullable().optional(),
  educationLevel: z.enum(['S1', 'S2', 'S3', 'lainnya']),
  field: z.string().trim().min(1, 'Field is required').max(200),
  institution: z.string().trim().min(1, 'Institution is required').max(200),
  topic: z.string().trim().min(1, 'Topic is required').max(500),
  method: z.string().trim().min(1, 'Method is required').max(200),
  pages: z.number().int().min(0).max(2000),
  documentCondition: z.enum(DOCUMENT_CONDITIONS),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be YYYY-MM-DD')
    .refine((value) => value >= todayString(), { message: 'Deadline must be today or later' }),
  specialNeeds: z.string().trim().max(2000).nullable().optional(),
  contactName: personNameSchema,
  contactWhatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{9,16}$/, 'WhatsApp number must be 9–16 digits'),
  attachmentIds: z.array(z.string().min(1)).max(10).default([]),
  estimateMin: z.number().int().min(0).nullable().optional(),
  estimateMax: z.number().int().min(0).nullable().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const orderSchema = z.object({
  id: z.string(),
  number: z.string(),
  status: z.enum(ORDER_STATUSES),
  serviceSlug: z.string(),
  deadline: z.string(),
  estimateMin: z.number().nullable(),
  estimateMax: z.number().nullable(),
});

export type Order = z.infer<typeof orderSchema>;

export interface OrderSuccess<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface OrderError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export type CreateOrderResponse = OrderSuccess<{ order: Order }> | OrderError;
