import { Hono } from 'hono';
import { listPortfolioItems } from './repository';

export const portfolioRoutes = new Hono().get('/', (context) => {
  const items = listPortfolioItems(context.req.query('category') || undefined);
  return context.json({ success: true as const, message: 'Portfolio retrieved', data: { items } });
});
