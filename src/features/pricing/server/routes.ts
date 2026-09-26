import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { getCurrentUser, isAdmin, SESSION_COOKIE_NAME } from '../../auth';
import { createPackageInputSchema, updatePackageInputSchema } from '../contract';
import { createPackage, deletePackage, listPackagesGrouped, updatePackage } from './repository';

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

function adminSession(context: Context): { id: string } | undefined {
  const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
  if (!sessionUser || !isAdmin(sessionUser.id)) return undefined;
  return sessionUser;
}

export const pricingRoutes = new Hono()
  .get('/', (context) => {
    const groups = listPackagesGrouped();
    return context.json({ success: true as const, message: 'Pricing retrieved', data: { groups } });
  })
  .post('/', async (context) => {
    const admin = adminSession(context);
    if (!admin) {
      const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
      if (!sessionUser) {
        return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
      }
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = createPackageInputSchema.safeParse(await requestBody(context));
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
    const created = createPackage(parsed.data);
    return context.json({ success: true as const, message: 'Package created', data: { package: created } }, 201);
  })
  .put('/:id', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = updatePackageInputSchema.safeParse(await requestBody(context));
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
    const updated = updatePackage(context.req.param('id'), parsed.data);
    if (!updated) {
      return context.json({ success: false as const, message: 'Package not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Package updated', data: { package: updated } });
  })
  .delete('/:id', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    if (!deletePackage(context.req.param('id'))) {
      return context.json({ success: false as const, message: 'Package not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Package deleted', data: undefined });
  });
