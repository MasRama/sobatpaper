import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { getCurrentUser, isAdmin, SESSION_COOKIE_NAME } from '../../auth';
import { portfolioItemInputSchema, updatePortfolioItemInputSchema } from '../contract';
import { createPortfolioItem, deletePortfolioItem, listPortfolioItems, updatePortfolioItem } from './repository';

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

export const portfolioRoutes = new Hono()
  .get('/', (context) => {
    const items = listPortfolioItems(context.req.query('category') || undefined);
    return context.json({ success: true as const, message: 'Portfolio retrieved', data: { items } });
  })
  .post('/', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = portfolioItemInputSchema.safeParse(await requestBody(context));
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
    const item = createPortfolioItem(parsed.data);
    return context.json({ success: true as const, message: 'Portfolio item created', data: { item } }, 201);
  })
  .put('/:id', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = updatePortfolioItemInputSchema.safeParse(await requestBody(context));
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
    const item = updatePortfolioItem(context.req.param('id'), parsed.data);
    if (!item) {
      return context.json({ success: false as const, message: 'Portfolio item not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Portfolio item updated', data: { item } });
  })
  .delete('/:id', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    if (!deletePortfolioItem(context.req.param('id'))) {
      return context.json({ success: false as const, message: 'Portfolio item not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Portfolio item deleted', data: undefined });
  });
