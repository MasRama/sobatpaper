/**
 * SobatPaper site-wide constants.
 *
 * The WhatsApp number and message templates move to the `site-settings`
 * feature (M1) so admin can change them without a deploy. Until then this
 * module is the single source for public contact details.
 */

export const SITE_NAME = 'sobatpaper.id';
export const SITE_TAGLINE = 'Academic Research Partner';
export const CONTACT_EMAIL = 'halo@sobatpaper.id';

/** Placeholder until `site-settings` lands. International format, no `+`. */
export const DEFAULT_WHATSAPP_NUMBER = '6280000000000';

export interface PublicNavItem {
  label: string;
  to: string;
}

export const PUBLIC_NAV_ITEMS: readonly PublicNavItem[] = [
  { label: 'Layanan', to: '/layanan' },
  { label: 'Harga', to: '/harga' },
  { label: 'Cara Kerja', to: '/cara-kerja' },
  { label: 'Portofolio', to: '/portfolio' },
  { label: 'FAQ', to: '/faq' },
];

export const DEFAULT_CONSULTATION_MESSAGE =
  'Halo SobatPaper, saya ingin konsultasi layanan. Mohon informasi estimasi biaya dan prosesnya.';

export function buildWhatsAppLink(
  message: string = DEFAULT_CONSULTATION_MESSAGE,
  number: string = DEFAULT_WHATSAPP_NUMBER,
): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
