import { getCookie } from 'hono/cookie';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { getCurrentUser, isAdmin, SESSION_COOKIE_NAME } from '../../auth';
import {
  settingKeySchema,
  updateSettingInputSchema,
  type SiteSettingsPublic,
} from '../contract';
import { getSetting, setSetting } from './repository';

export const FALLBACK_WHATSAPP_NUMBER = '6280000000000';
export const FALLBACK_CONSULTATION_MESSAGE =
  'Halo SobatPaper, saya ingin konsultasi layanan. Mohon informasi estimasi biaya dan prosesnya.';

function publicSettings(): SiteSettingsPublic {
  return {
    whatsappNumber: getSetting('whatsapp_number') ?? FALLBACK_WHATSAPP_NUMBER,
    consultationMessage: getSetting('consultation_message') ?? FALLBACK_CONSULTATION_MESSAGE,
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

export const siteSettingsRoutes = new Hono()
  .get('/public', (context) => {
    return context.json({ success: true as const, message: 'Settings retrieved', data: publicSettings() });
  })
  .put('/:key', async (context) => {
    const sessionUser = getCurrentUser(getCookie(context, SESSION_COOKIE_NAME));
    if (!sessionUser) {
      return context.json({ success: false as const, message: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
    if (!isAdmin(sessionUser.id)) {
      return context.json({ success: false as const, message: 'Forbidden', code: 'FORBIDDEN' }, 403);
    }
    const parsedKey = settingKeySchema.safeParse(context.req.param('key'));
    if (!parsedKey.success) {
      return context.json({ success: false as const, message: 'Unknown setting', code: 'NOT_FOUND' }, 404);
    }
    const parsed = updateSettingInputSchema.safeParse(await requestBody(context));
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
    setSetting(parsedKey.data, parsed.data.value);
    return context.json({
      success: true as const,
      message: 'Setting updated',
      data: { key: parsedKey.data, value: parsed.data.value },
    });
  });
