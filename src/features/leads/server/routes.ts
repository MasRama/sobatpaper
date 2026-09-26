import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { getCurrentUser, isAdmin, SESSION_COOKIE_NAME } from '../../auth';
import { createOrder, createOrderInputSchema, type Order } from '../../orders';
import {
  adminLeadsQuerySchema,
  createLeadInputSchema,
  updateLeadInputSchema,
} from '../contract';
import { createLead, findLeadById, listLeads, markLeadConverted, updateLead } from './repository';

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

export const leadsRoutes = new Hono()
  .post('/', async (context) => {
    const parsed = createLeadInputSchema.safeParse(await requestBody(context));
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
    const lead = createLead(parsed.data);
    return context.json({ success: true as const, message: 'Lead submitted', data: { lead } }, 201);
  })
  .get('/', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = adminLeadsQuerySchema.safeParse(context.req.query());
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
    const { leads, total } = listLeads(parsed.data);
    return context.json({ success: true as const, message: 'Leads retrieved', data: { leads, total } });
  })
  .get('/:id', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const lead = findLeadById(context.req.param('id'));
    if (!lead) {
      return context.json({ success: false as const, message: 'Lead not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Lead retrieved', data: { lead } });
  })
  .patch('/:id', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const existing = findLeadById(context.req.param('id'));
    if (!existing) {
      return context.json({ success: false as const, message: 'Lead not found', code: 'NOT_FOUND' }, 404);
    }
    if (existing.status === 'converted') {
      return context.json(
        { success: false as const, message: 'Lead already converted', code: 'LEAD_CONVERTED' },
        409,
      );
    }
    const parsed = updateLeadInputSchema.safeParse(await requestBody(context));
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
    const lead = updateLead(context.req.param('id'), parsed.data);
    return context.json({ success: true as const, message: 'Lead updated', data: { lead } });
  })
  .post('/:id/convert', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const existing = findLeadById(context.req.param('id'));
    if (!existing) {
      return context.json({ success: false as const, message: 'Lead not found', code: 'NOT_FOUND' }, 404);
    }
    if (existing.status === 'converted') {
      return context.json(
        { success: false as const, message: 'Lead already converted', code: 'LEAD_CONVERTED' },
        409,
      );
    }
    const parsed = createOrderInputSchema.safeParse(await requestBody(context));
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
    const order: Order = createOrder(parsed.data);
    const lead = markLeadConverted(existing.id, order.id);
    return context.json({ success: true as const, message: 'Lead converted', data: { lead, order } }, 201);
  });