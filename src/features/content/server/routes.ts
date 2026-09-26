import { Hono } from 'hono';
import { findPageBySlug, listFaqs } from './repository';

export const contentRoutes = new Hono()
  .get('/pages/:slug', (context) => {
    const page = findPageBySlug(context.req.param('slug'));
    if (!page) {
      return context.json({ success: false as const, message: 'Page not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Page retrieved', data: { page } });
  })
  .get('/faqs', (context) => {
    const category = context.req.query('category');
    const faqs = listFaqs(category || undefined);
    return context.json({ success: true as const, message: 'FAQs retrieved', data: { faqs } });
  });
