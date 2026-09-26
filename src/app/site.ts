/**
 * SobatPaper site-wide static constants.
 *
 * Contact details (WhatsApp number, message templates) live in the
 * `site-settings` feature so admin can change them without a deploy —
 * consume them through `useSiteSettings()` from
 * `@/features/site-settings/web`.
 */

export const SITE_NAME = 'sobatpaper.id';
export const SITE_TAGLINE = 'Academic Research Partner';
export const CONTACT_EMAIL = 'halo@sobatpaper.id';

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
