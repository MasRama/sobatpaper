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

export type PortfolioListResponse = PortfolioSuccess<{ items: PortfolioItem[] }> | PortfolioError;
