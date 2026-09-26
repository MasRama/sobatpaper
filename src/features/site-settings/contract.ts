import { z } from 'zod';

export const SETTING_KEYS = ['whatsapp_number', 'consultation_message'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export const settingKeySchema = z.enum(SETTING_KEYS);

export const updateSettingInputSchema = z.object({
  value: z.string().trim().min(1, 'Value is required').max(2000, 'Value must be at most 2000 characters'),
});

export type UpdateSettingInput = z.infer<typeof updateSettingInputSchema>;

export interface SiteSettingsPublic {
  whatsappNumber: string;
  consultationMessage: string;
}

export interface SettingSuccess<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface SettingError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export type PublicSettingsResponse = SettingSuccess<SiteSettingsPublic> | SettingError;
export type UpdateSettingResponse = SettingSuccess<{ key: string; value: string }> | SettingError;
