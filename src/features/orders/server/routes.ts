import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { createOrderInputSchema } from '../contract';
import { createOrder } from './repository';

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

export const ordersRoutes = new Hono().post('/', async (context) => {
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
});
