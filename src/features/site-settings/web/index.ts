export {
  buildWhatsAppLink,
  FALLBACK_SETTINGS,
  useSiteSettings,
  type SiteSettings,
} from './composables/useSiteSettings';
export { createSiteSettingsAdminClient, type SiteSettingsAdminClient } from './admin-client';
export type { SettingKey, SiteSettingsPublic, UpdateSettingResponse } from '../contract';
export { default as AdminSettingsPage } from './pages/AdminSettingsPage.vue';
