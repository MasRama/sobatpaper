import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { getCurrentUser, isAdmin, SESSION_COOKIE_NAME } from '../../auth';
import { testimonialInputSchema, updateTestimonialInputSchema } from '../contract';
import { createTestimonial, deleteTestimonial, listTestimonials, updateTestimonial } from './repository';

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

export const testimonialRoutes = new Hono()
  .get('/', (context) => {
    const testimonials = listTestimonials();
    return context.json({ success: true as const, message: 'Testimonials retrieved', data: { testimonials } });
  })
  .post('/', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = testimonialInputSchema.safeParse(await requestBody(context));
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
    const testimonial = createTestimonial(parsed.data);
    return context.json({ success: true as const, message: 'Testimonial created', data: { testimonial } }, 201);
  })
  .put('/:id', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = updateTestimonialInputSchema.safeParse(await requestBody(context));
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
    const testimonial = updateTestimonial(context.req.param('id'), parsed.data);
    if (!testimonial) {
      return context.json({ success: false as const, message: 'Testimonial not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Testimonial updated', data: { testimonial } });
  })
  .delete('/:id', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    if (!deleteTestimonial(context.req.param('id'))) {
      return context.json({ success: false as const, message: 'Testimonial not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Testimonial deleted', data: undefined });
  });
