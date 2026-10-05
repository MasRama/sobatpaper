<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useSiteSettings } from '../../features/site-settings/web';
import { CONTACT_EMAIL, PUBLIC_NAV_ITEMS, SITE_NAME, SITE_TAGLINE } from '../site';

const currentYear = new Date().getFullYear();
const route = useRoute();
const { consultLink, load, settings } = useSiteSettings();
const whatsappDisplay = computed(() => `+${settings.value.whatsappNumber}`);
const isHome = computed(() => route.path === '/');
const isDark = ref(false);
const isMobileMenuOpen = ref(false);

function syncThemeState(): void {
  isDark.value = document.documentElement.classList.contains('dark');
}

function updateThemeColor(dark: boolean): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#0d0f13' : '#f7f5f2';
}

function toggleTheme(): void {
  const nextDark = !isDark.value;
  isDark.value = nextDark;
  document.documentElement.classList.toggle('dark', nextDark);
  updateThemeColor(nextDark);

  try {
    window.localStorage.setItem('sobatpaper-theme', nextDark ? 'dark' : 'light');
  } catch {
    // Theme still works when local storage is unavailable.
  }
}

onMounted(() => {
  syncThemeState();
  updateThemeColor(isDark.value);
});

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false;
  },
);

void load();
</script>

<template>
  <div class="min-h-[100dvh] bg-background font-body text-foreground antialiased">
    <header v-if="isHome" class="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5">
      <nav
        class="pointer-events-auto relative mx-auto flex min-h-14 max-w-[1180px] items-center gap-3 rounded-[22px] border border-black/[0.06] bg-[#fffdf9]/88 px-3 py-2 shadow-[0_14px_45px_rgba(28,24,20,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#15171c]/88 dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:px-4"
        aria-label="Navigasi utama"
      >
        <RouterLink
          to="/"
          class="flex shrink-0 items-center rounded-full px-2 py-2 font-['Plus_Jakarta_Sans'] text-[17px] font-extrabold tracking-[-0.04em] text-[#171719] dark:text-[#f7f3ee]"
          :aria-label="`Beranda ${SITE_NAME}`"
        >
          sobatpaper<span class="text-[#f06f4f]">.</span>
        </RouterLink>

        <div class="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full bg-black/[0.035] p-1 dark:bg-white/[0.055] lg:flex">
          <RouterLink
            v-for="item in PUBLIC_NAV_ITEMS"
            :key="item.to"
            :to="item.to"
            class="rounded-full px-3.5 py-2 font-['Plus_Jakarta_Sans'] text-[12px] font-semibold text-[#68635e] transition hover:bg-white/80 hover:text-[#171719] dark:text-[#aaa6a1] dark:hover:bg-white/[0.08] dark:hover:text-white"
            active-class="bg-white text-[#171719] shadow-sm dark:bg-white/[0.1] dark:text-white dark:shadow-none"
          >
            {{ item.label }}
          </RouterLink>
        </div>

        <div class="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            class="grid h-10 w-10 place-items-center rounded-full text-[#5d5955] transition hover:bg-black/[0.045] hover:text-[#171719] dark:text-[#b9b4ae] dark:hover:bg-white/[0.08] dark:hover:text-white"
            :aria-label="isDark ? 'Gunakan mode terang' : 'Gunakan mode gelap'"
            :title="isDark ? 'Mode terang' : 'Mode gelap'"
            @click="toggleTheme"
          >
            <svg v-if="isDark" viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="3.5" />
              <path d="M12 2v2.1M12 19.9V22M4.93 4.93l1.49 1.49M17.58 17.58l1.49 1.49M2 12h2.1M19.9 12H22M4.93 19.07l1.49-1.49M17.58 6.42l1.49-1.49" />
            </svg>
            <svg v-else viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M20.4 14.9A8.5 8.5 0 0 1 9.1 3.6 8.5 8.5 0 1 0 20.4 14.9Z" />
            </svg>
          </button>

          <a
            :href="consultLink"
            target="_blank"
            rel="noreferrer"
            class="hidden whitespace-nowrap rounded-full bg-[#1a191b] px-4 py-2.5 font-['Plus_Jakarta_Sans'] text-[12px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#313034] dark:bg-[#f2eee8] dark:text-[#171719] dark:hover:bg-white sm:inline-flex"
          >
            Konsultasi
            <svg viewBox="0 0 20 20" class="ml-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M4 10h11M11 6l4 4-4 4" />
            </svg>
          </a>

          <button
            type="button"
            class="grid h-10 w-10 place-items-center rounded-full text-[#171719] transition hover:bg-black/[0.045] dark:text-[#f7f3ee] dark:hover:bg-white/[0.08] lg:hidden"
            :aria-expanded="isMobileMenuOpen"
            aria-controls="landing-mobile-menu"
            aria-label="Buka menu"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <svg v-if="!isMobileMenuOpen" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M4 8h16M4 16h16" />
            </svg>
            <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div
          v-if="isMobileMenuOpen"
          id="landing-mobile-menu"
          class="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-[22px] border border-black/[0.06] bg-[#fffdf9]/96 p-2 shadow-[0_20px_50px_rgba(28,24,20,0.12)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#15171c]/96 lg:hidden"
        >
          <RouterLink
            v-for="item in PUBLIC_NAV_ITEMS"
            :key="item.to"
            :to="item.to"
            class="flex items-center justify-between rounded-2xl px-4 py-3 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#57534f] transition hover:bg-black/[0.035] hover:text-[#171719] dark:text-[#bbb6b0] dark:hover:bg-white/[0.06] dark:hover:text-white"
            active-class="bg-black/[0.04] text-[#171719] dark:bg-white/[0.07] dark:text-white"
          >
            <span>{{ item.label }}</span>
            <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 opacity-45" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M4 10h11M11 6l4 4-4 4" />
            </svg>
          </RouterLink>
          <a
            :href="consultLink"
            target="_blank"
            rel="noreferrer"
            class="mt-1 flex items-center justify-between rounded-2xl bg-[#1a191b] px-4 py-3 font-['Plus_Jakarta_Sans'] text-sm font-bold text-white dark:bg-[#f2eee8] dark:text-[#171719]"
          >
            Mulai konsultasi
            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M4 10h11M11 6l4 4-4 4" />
            </svg>
          </a>
        </div>
      </nav>
    </header>

    <header v-else class="sticky inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <nav class="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 lg:flex-nowrap lg:px-8" aria-label="Navigasi utama">
        <RouterLink to="/" class="flex shrink-0 items-center gap-2" :aria-label="`Beranda ${SITE_NAME}`">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-secondary-400">S</span>
          <span class="leading-tight">
            <span class="block font-heading text-base font-semibold tracking-tight">sobatpaper.id</span>
            <span class="block text-[11px] text-muted-foreground">{{ SITE_TAGLINE }}</span>
          </span>
        </RouterLink>

        <div class="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 lg:order-none lg:w-auto lg:flex-1 lg:pb-0">
          <RouterLink
            v-for="item in PUBLIC_NAV_ITEMS"
            :key="item.to"
            :to="item.to"
            class="shrink-0 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            active-class="bg-muted text-foreground"
          >
            {{ item.label }}
          </RouterLink>
        </div>

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <a
            :href="consultLink"
            target="_blank"
            rel="noreferrer"
            class="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Konsultasi Sekarang
          </a>
        </div>
      </nav>
    </header>

    <slot />

    <footer class="border-t border-border bg-primary-950 text-primary-100">
      <div class="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p class="font-heading text-lg font-semibold text-white">{{ SITE_NAME }}</p>
          <p class="mt-1 text-sm text-primary-200">{{ SITE_TAGLINE }}</p>
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-primary-200">
            Pendampingan riset, penulisan akademik, analisis data, editing, dan publikasi artikel ilmiah.
          </p>
        </div>
        <nav aria-label="Tautan layanan">
          <p class="font-heading text-xs uppercase tracking-[0.2em] text-secondary-300">Layanan</p>
          <ul class="mt-4 space-y-2 text-sm">
            <li><RouterLink to="/layanan" class="hover:text-white">Semua Layanan</RouterLink></li>
            <li><RouterLink to="/harga" class="hover:text-white">Harga</RouterLink></li>
            <li><RouterLink to="/portfolio" class="hover:text-white">Portofolio</RouterLink></li>
            <li><RouterLink to="/cara-kerja" class="hover:text-white">Cara Kerja</RouterLink></li>
          </ul>
        </nav>
        <nav aria-label="Tautan bantuan">
          <p class="font-heading text-xs uppercase tracking-[0.2em] text-secondary-300">Bantuan</p>
          <ul class="mt-4 space-y-2 text-sm">
            <li><RouterLink to="/tentang-kami" class="hover:text-white">Tentang Kami</RouterLink></li>
            <li><RouterLink to="/faq" class="hover:text-white">FAQ</RouterLink></li>
            <li><RouterLink to="/kebijakan-privasi" class="hover:text-white">Kebijakan Privasi</RouterLink></li>
            <li><RouterLink to="/syarat-ketentuan" class="hover:text-white">Syarat &amp; Ketentuan</RouterLink></li>
          </ul>
        </nav>
        <div>
          <p class="font-heading text-xs uppercase tracking-[0.2em] text-secondary-300">Kontak</p>
          <ul class="mt-4 space-y-2 text-sm">
            <li>
              <a :href="consultLink" target="_blank" rel="noreferrer" class="hover:text-white">
                WhatsApp {{ whatsappDisplay }}
              </a>
            </li>
            <li>
              <a :href="`mailto:${CONTACT_EMAIL}`" class="hover:text-white">{{ CONTACT_EMAIL }}</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="border-t border-white/10">
        <p class="mx-auto max-w-6xl px-6 py-5 text-xs text-primary-300 lg:px-8">
          © {{ currentYear }} {{ SITE_NAME }} — {{ SITE_TAGLINE }}.
        </p>
      </div>
    </footer>

    <a
      :href="consultLink"
      target="_blank"
      rel="noreferrer"
      class="fixed bottom-5 z-50 px-5 py-3 text-sm font-semibold shadow-lg transition md:hidden"
      :class="isHome
        ? 'left-4 right-4 rounded-full bg-[#17191e] text-center text-white hover:-translate-y-0.5 dark:bg-[#f4f2ed] dark:text-[#17191e]'
        : 'right-5 rounded-full bg-primary text-primary-foreground hover:opacity-90'"
      aria-label="Konsultasi via WhatsApp"
    >
      {{ isHome ? 'Ceritakan kebutuhanmu via WhatsApp' : 'Konsultasi WhatsApp' }}
    </a>
  </div>
</template>
