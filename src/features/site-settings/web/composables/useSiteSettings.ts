import { computed, readonly, ref, type ComputedRef, type Ref } from 'vue';
import type { PublicSettingsResponse, SiteSettingsPublic } from '../../contract';

export const FALLBACK_SETTINGS: SiteSettingsPublic = {
  whatsappNumber: '6280000000000',
  consultationMessage: 'Halo SobatPaper, saya ingin konsultasi layanan. Mohon informasi estimasi biaya dan prosesnya.',
};

const settings: Ref<SiteSettingsPublic> = ref({ ...FALLBACK_SETTINGS });
let pending: Promise<void> | undefined;

async function fetchSettings(): Promise<void> {
  try {
    const response = await fetch('/api/site-settings/public', { credentials: 'include' });
    const payload = (await response.json()) as PublicSettingsResponse;
    if (payload.success) settings.value = payload.data;
  } catch {
    // Keep fallback settings when the API is unreachable.
  }
}

export function buildWhatsAppLink(message: string, number: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export interface SiteSettings {
  readonly settings: Ref<SiteSettingsPublic>;
  readonly consultLink: ComputedRef<string>;
  load(): Promise<void>;
  linkFor(message: string): string;
}

export function useSiteSettings(): SiteSettings {
  function load(): Promise<void> {
    pending ??= fetchSettings().finally(() => {
      pending = undefined;
    });
    return pending;
  }

  return {
    settings: readonly(settings) as Ref<SiteSettingsPublic>,
    consultLink: computed(() => buildWhatsAppLink(settings.value.consultationMessage, settings.value.whatsappNumber)),
    load,
    linkFor: (message: string) => buildWhatsAppLink(message, settings.value.whatsappNumber),
  };
}
