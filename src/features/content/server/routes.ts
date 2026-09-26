import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { getCurrentUser, isAdmin, SESSION_COOKIE_NAME } from '../../auth';
import { faqInputSchema, updateFaqInputSchema, updatePageInputSchema } from '../contract';
import { createFaq, deleteFaq, findPageBySlug, listFaqs, updateFaq, updatePageBySlug } from './repository';

async function requestBody(context: Context): Promise<unknown> {
  try {
    return await context.req.json();
  } catch {
    return {};
  }
}

function validationErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    errors[key] ??= [];
    errors[key].push(issue.message);
  }
  return errors;
}

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
  })
  .put('/pages/:slug', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = updatePageInputSchema.safeParse(await requestBody(context));
    if (!parsed.success) {
      return context.json(
        {
          success: false as const,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: validationErrors(parsed.error),
        },
        422,
      );
    }
    const page = updatePageBySlug(context.req.param('slug'), parsed.data);
    if (!page) {
      return context.json({ success: false as const, message: 'Page not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Page updated', data: { page } });
  })
  .post('/faqs', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = faqInputSchema.safeParse(await requestBody(context));
    if (!parsed.success) {
      return context.json(
        {
          success: false as const,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: validationErrors(parsed.error),
        },
        422,
      );
    }
    const faq = createFaq(parsed.data);
    return context.json({ success: true as const, message: 'FAQ created', data: { faq } }, 201);
  })
  .put('/faqs/:id', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = updateFaqInputSchema.safeParse(await requestBody(context));
    if (!parsed.success) {
      return context.json(
        {
          success: false as const,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: validationErrors(parsed.error),
        },
        422,
      );
    }
    const faq = updateFaq(context.req.param('id'), parsed.data);
    if (!faq) {
      return context.json({ success: false as const, message: 'FAQ not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'FAQ updated', data: { faq } });
  })
  .delete('/faqs/:id', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    if (!deleteFaq(context.req.param('id'))) {
      return context.json({ success: false as const, message: 'FAQ not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'FAQ deleted', data: undefined });
  });
