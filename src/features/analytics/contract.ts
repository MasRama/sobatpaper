import { z } from 'zod';

export const ANALYTICS_EVENTS = [
  'view_service',
  'view_price',
  'start_order',
  'submit_order',
  'click_whatsapp',
  'upload_document',
  'payment_success',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export const analyticsPayloadSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export type AnalyticsPayload = z.infer<typeof analyticsPayloadSchema>;

export const trackEventInputSchema = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  payload: analyticsPayloadSchema.default({}),
});

export type TrackEventInput = z.infer<typeof trackEventInputSchema>;

export interface AnalyticsSuccess<T = undefined> {
  success: true;
  message: string;
  data: T;
}

export interface AnalyticsError {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export type TrackEventResponse = AnalyticsSuccess<{ id: string }> | AnalyticsError;
export type AnalyticsSummaryResponse =
  | AnalyticsSuccess<{ counts: Record<string, number>; total: number }>
  | AnalyticsError;
