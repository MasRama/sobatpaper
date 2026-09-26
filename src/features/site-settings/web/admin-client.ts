import { csrfHeaders, ensureCsrfToken } from '../../auth/web';
import type { SettingKey, UpdateSettingResponse } from '../contract';

export interface SiteSettingsAdminClient {
  update(key: SettingKey, value: string): Promise<UpdateSettingResponse>;
}

export function createSiteSettingsAdminClient(baseUrl = '/api/site-settings'): SiteSettingsAdminClient {
  const root = baseUrl.replace(/\/$/, '');
  return {
    update: async (key, value) => {
      await ensureCsrfToken();
      const response = await fetch(`${root}/${encodeURIComponent(key)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      return (await response.json()) as UpdateSettingResponse;
    },
  };
}
