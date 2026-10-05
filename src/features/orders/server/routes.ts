import { Buffer } from 'node:buffer';
import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { findAccountById, getCurrentUser, isAdmin, SESSION_COOKIE_NAME } from '../../auth';
import { trackEvent } from '../../analytics';
import {
  contentMatchesExtension,
  listAttachmentsByOrder,
  readStoredUpload,
  safeOriginalName,
  storeValidatedUpload,
  validateUpload,
} from '../../attachments';
import {
  adminOrdersQuerySchema,
  createOrderInputSchema,
  createOrderPaymentInputSchema,
  updateOrderInputSchema,
} from '../contract';
import {
  createOrder,
  createOrderFinalFile,
  createOrderPayment,
  deleteOrderFinalFile,
  deleteOrderPayment,
  findOrderDetailById,
  findOrderFinalFile,
  listOrderEvents,
  listOrderFinalFiles,
  listOrderPayments,
  listOrders,
  updateOrder,
} from './repository';

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};

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
      data: {
        order,
        attachments: listAttachmentsByOrder(order.id),
        events: listOrderEvents(order.id),
        payments: listOrderPayments(order.id),
        finalFiles: listOrderFinalFiles(order.id),
      },
    });
  })
  .post('/:id/payments', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    if (!isAdmin(sessionUser.id)) return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    const parsed = createOrderPaymentInputSchema.safeParse(await requestBody(context));
    if (!parsed.success) {
      return context.json({ success: false as const, message: 'Validation failed', code: 'VALIDATION_ERROR', errors: validationErrors(parsed.error) }, 422);
    }
    const payment = createOrderPayment(context.req.param('id'), parsed.data, { id: sessionUser.id, name: sessionUser.name });
    return context.json({ success: true as const, message: 'Payment recorded', data: { payment } }, 201);
  })
  .delete('/:id/payments/:paymentId', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    if (!isAdmin(sessionUser.id)) return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    if (!findOrderDetailById(context.req.param('id'))) return context.json({ success: false as const, message: 'Order not found', code: 'NOT_FOUND' }, 404);
    if (!deleteOrderPayment(context.req.param('id'), context.req.param('paymentId'))) {
      return context.json({ success: false as const, message: 'Payment not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Payment deleted', data: undefined });
  })
  .post('/:id/final-files', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    if (!isAdmin(sessionUser.id)) return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    if (!findOrderDetailById(context.req.param('id'))) return context.json({ success: false as const, message: 'Order not found', code: 'NOT_FOUND' }, 404);
    const body = await context.req.parseBody();
    const validated = validateUpload(body.file);
    if ('code' in validated) {
      const status = validated.code === 'FILE_TOO_LARGE' ? 413 : 422;
      return context.json({ success: false as const, message: validated.code === 'FILE_TOO_LARGE' ? 'File exceeds the 10 MB limit' : 'Invalid file', code: validated.code }, status);
    }
    const bytes = new Uint8Array(await validated.file.arrayBuffer());
    if (!contentMatchesExtension(bytes, validated.extension)) {
      return context.json({ success: false as const, message: 'File content does not match its extension', code: 'FILE_CONTENT_MISMATCH' }, 422);
    }
    const storedName = storeValidatedUpload(validated.extension, bytes);
    const file = createOrderFinalFile({
      orderId: context.req.param('id'),
      originalName: validated.name,
      storedName,
      mimeType: MIME_BY_EXTENSION[validated.extension] ?? 'application/octet-stream',
      size: bytes.length,
      actor: { id: sessionUser.id, name: sessionUser.name },
    });
    return context.json({ success: true as const, message: 'Final file uploaded', data: { file } }, 201);
  })
  .get('/:id/final-files/:fileId', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    if (!isAdmin(sessionUser.id)) return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    const row = findOrderFinalFile(context.req.param('id'), context.req.param('fileId'));
    const bytes = row ? readStoredUpload(row.stored_name) : undefined;
    if (!row || !bytes) return context.json({ success: false as const, message: 'Final file not found', code: 'NOT_FOUND' }, 404);
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': row.mime_type,
        'Content-Disposition': `attachment; filename="${safeOriginalName(row.original_name)}"`,
        'Cache-Control': 'no-store',
      },
    });
  })
  .delete('/:id/final-files/:fileId', (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    if (!isAdmin(sessionUser.id)) return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    if (!findOrderDetailById(context.req.param('id'))) return context.json({ success: false as const, message: 'Order not found', code: 'NOT_FOUND' }, 404);
    if (!deleteOrderFinalFile(context.req.param('id'), context.req.param('fileId'))) {
      return context.json({ success: false as const, message: 'Final file not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Final file deleted', data: undefined });
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
    const existing = findOrderDetailById(context.req.param('id'));
    const order = updateOrder(context.req.param('id'), parsed.data, { id: sessionUser.id, name: sessionUser.name });
    if (existing?.status !== 'paid' && order.status === 'paid') {
      trackEvent({
        name: 'payment_success',
        payload: {
          order_id: order.number,
          service: order.serviceSlug,
          amount: order.finalPrice ?? 0,
        },
      });
    }
    return context.json({ success: true as const, message: 'Order updated', data: { order } });
  });
