import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { quoteInputSchema } from '../contract';
import { quoteEstimation } from './quote';

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

export const estimationRoutes = new Hono().post('/quote', async (context) => {
  const parsed = quoteInputSchema.safeParse(await requestBody(context));
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
  const quote = quoteEstimation(parsed.data);
  return context.json({ success: true as const, message: 'Estimate calculated', data: quote });
});
