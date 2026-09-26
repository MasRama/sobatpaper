import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { findAccountById, getCurrentUser, isAdmin, SESSION_COOKIE_NAME } from '../../auth';
import { listAttachmentsByOrder } from '../../attachments';
import { adminOrdersQuerySchema, createOrderInputSchema, updateOrderInputSchema } from '../contract';
import { createOrder, findOrderDetailById, listOrderEvents, listOrders, updateOrder } from './repository';

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

export const ordersRoutes = new Hono()
  .post('/', async (context) => {
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
    const order = createOrder(parsed.data);
    return context.json({ success: true as const, message: 'Order submitted', data: { order } }, 201);
  })
  .get('/', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = adminOrdersQuerySchema.safeParse(context.req.query());
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
    const { orders, total } = listOrders(parsed.data);
    return context.json({ success: true as const, message: 'Orders retrieved', data: { orders, total } });
  })
  .get('/:id', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const order = findOrderDetailById(context.req.param('id'));
    if (!order) {
      return context.json({ success: false as const, message: 'Order not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({
      success: true as const,
      message: 'Order retrieved',
      data: { order, attachments: listAttachmentsByOrder(order.id), events: listOrderEvents(order.id) },
    });
  })
  .patch('/:id', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsed = updateOrderInputSchema.safeParse(await requestBody(context));
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
    if (parsed.data.picUserId && !findAccountById(parsed.data.picUserId)) {
      return context.json(
        {
          success: false as const,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: { picUserId: ['Unknown user'] },
        },
        422,
      );
    }
    const order = updateOrder(context.req.param('id'), parsed.data, { id: sessionUser.id, name: sessionUser.name });
    return context.json({ success: true as const, message: 'Order updated', data: { order } });
  });
