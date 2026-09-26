import { z } from 'zod';

export const PORTFOLIO_CATEGORIES = [
  'Skripsi',
  'Tesis',
  'Analisis Data',
  'Artikel',
  'Formatting',
  'Research',
  'Education',
] as const;

export const portfolioItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  summary: z.string(),
});

export type PortfolioItem = z.infer<typeof portfolioItemSchema>;

export interface PortfolioSuccess<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface PortfolioError {
  success: false;
  message: string;
  code: string;
}


export const portfolioItemInputSchema = z.object({
  category: z.enum(PORTFOLIO_CATEGORIES),
  title: z.string().trim().min(1, 'Title is required').max(200),
  summary: z.string().trim().min(1, 'Summary is required').max(2000),
  sortOrder: z.number().int().default(0),
});

export type PortfolioItemInput = z.infer<typeof portfolioItemInputSchema>;

export const updatePortfolioItemInputSchema = z
  .object({
    category: z.enum(PORTFOLIO_CATEGORIES).optional(),
    title: portfolioItemInputSchema.shape.title.optional(),
    summary: portfolioItemInputSchema.shape.summary.optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Nothing to update',
  });

export type UpdatePortfolioItemInput = z.infer<typeof updatePortfolioItemInputSchema>;

export type PortfolioMutationResponse = PortfolioSuccess<{ item: PortfolioItem }> | PortfolioError;
export type PortfolioListResponse = PortfolioSuccess<{ items: PortfolioItem[] }> | PortfolioError;
