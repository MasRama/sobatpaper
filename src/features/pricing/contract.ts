import { z } from 'zod';

export const pricingPackageSchema = z.object({
  id: z.string(),
  groupSlug: z.string(),
  groupName: z.string(),
  name: z.string(),
  price: z.number(),
  unit: z.string().nullable(),
  note: z.string().nullable(),
});

export const pricingGroupSchema = z.object({
  slug: z.string(),
  name: z.string(),
  packages: z.array(pricingPackageSchema),
});

export const createPackageInputSchema = z.object({
  groupSlug: z.string().trim().min(1).max(100),
  groupName: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(200),
  price: z.number().int().min(0).max(1_000_000_000),
  unit: z.string().trim().max(100).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
});

export const updatePackageInputSchema = z
  .object({
    groupSlug: z.string().trim().min(1).max(100).optional(),
    groupName: z.string().trim().min(1).max(200).optional(),
    name: z.string().trim().min(1).max(200).optional(),
    price: z.number().int().min(0).max(1_000_000_000).optional(),
    unit: z.string().trim().max(100).nullable().optional(),
    note: z.string().trim().max(1000).nullable().optional(),
    sortOrder: z.number().int().min(0).max(100000).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'At least one field is required to update',
  });

export type PricingPackage = z.infer<typeof pricingPackageSchema>;
export type PricingGroup = z.infer<typeof pricingGroupSchema>;
export type CreatePackageInput = z.infer<typeof createPackageInputSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageInputSchema>;

export interface PricingSuccess<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface PricingError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export type PricingListResponse = PricingSuccess<{ groups: PricingGroup[] }> | PricingError;
export type PricingPackageResponse = PricingSuccess<{ package: PricingPackage }> | PricingError;
