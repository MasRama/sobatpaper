import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { getCurrentUser, isAdmin, SESSION_COOKIE_NAME } from '../../auth';
import type { ServiceDetail, ServiceSummary } from '../contract';
import { createServiceInputSchema, updateServiceInputSchema } from '../contract';
import {
  createService,
  deleteService,
  findServiceBySlug,
  listServiceFaqs,
  listServices,
  updateService,
  type ServiceRow,
} from './repository';

function toSummary(row: ServiceRow): ServiceSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    startingPrice: row.starting_price,
    estimatedTime: row.estimated_time,
  };
}

function toDetail(row: ServiceRow): ServiceDetail {
  const faqs = listServiceFaqs(row.id).map((faq) => ({ question: faq.question, answer: faq.answer }));
  return {
    ...toSummary(row),
    description: row.description,
    scope: row.scope,
    process: row.process,
    disclaimer: row.disclaimer,
    faqs,
  };
}

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

export const servicesRoutes = new Hono()
  .get('/', (context) => {
    const services = listServices().map(toSummary);
    return context.json({ success: true as const, message: 'Services retrieved', data: { services } });
  })
  .get('/:slug', (context) => {
    const service = findServiceBySlug(context.req.param('slug'));
    if (!service) {
      return context.json({ success: false as const, message: 'Service not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Service retrieved', data: { service: toDetail(service) } });
  })
  .post('/', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = createServiceInputSchema.safeParse(await requestBody(context));
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
    const service = createService(parsed.data);
    return context.json({ success: true as const, message: 'Service created', data: { service: toDetail(service) } }, 201);
  })
  .put('/:id', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = updateServiceInputSchema.safeParse(await requestBody(context));
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
    const service = updateService(context.req.param('id'), parsed.data);
    if (!service) {
      return context.json({ success: false as const, message: 'Service not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Service updated', data: { service: toDetail(service) } });
  })
  .delete('/:id', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    if (!deleteService(context.req.param('id'))) {
      return context.json({ success: false as const, message: 'Service not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Service deleted', data: undefined });
  });
