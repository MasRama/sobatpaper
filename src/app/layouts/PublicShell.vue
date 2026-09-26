<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useSiteSettings } from '../../features/site-settings/web';
import { CONTACT_EMAIL, PUBLIC_NAV_ITEMS, SITE_NAME, SITE_TAGLINE } from '../site';

const currentYear = new Date().getFullYear();
const { consultLink, load, settings } = useSiteSettings();
const whatsappDisplay = computed(() => `+${settings.value.whatsappNumber}`);

void load();
</script>

<template>
  <div class="min-h-[100dvh] bg-background font-body text-foreground antialiased">
    <header class="sticky inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
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
      class="fixed bottom-5 right-5 z-50 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90 md:hidden"
      aria-label="Konsultasi via WhatsApp"
    >
      Konsultasi WhatsApp
    </a>
  </div>
</template>
