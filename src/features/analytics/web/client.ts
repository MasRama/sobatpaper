import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type { AnalyticsEventName, AnalyticsPayload, TrackEventResponse } from '../contract';

export interface AnalyticsClient {
  track(name: AnalyticsEventName, payload?: AnalyticsPayload): void;
}

export function createAnalyticsClient(baseUrl = '/api/analytics'): AnalyticsClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    track: (name, payload = {}) => {
      void (async () => {
        try {
          await ensureCsrfToken();
          const response = await fetch(`${root}/events`, {
            method: 'POST',
            credentials: 'include',
            headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, payload }),
          });
          await (response.json() as Promise<TrackEventResponse>);
        } catch {
          // Analytics must never break the user journey.
        }
      })();
    },
  };
}
