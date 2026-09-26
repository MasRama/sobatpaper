<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthSession } from '../../features/auth/web';
import { SITE_NAME } from '../site';

interface AdminNavItem {
  label: string;
  to?: string;
}

const NAV_ITEMS: readonly AdminNavItem[] = [
  { label: 'Dasbor', to: '/admin' },
  { label: 'Order' },
  { label: 'Layanan' },
  { label: 'Harga' },
  { label: 'Leads' },
  { label: 'Portofolio' },
  { label: 'Testimonial' },
  { label: 'FAQ' },
  { label: 'Pengaturan' },
];

const authSession = useAuthSession();
const router = useRouter();
const isLoggingOut = ref(false);
const logoutError = ref('');

async function logout(): Promise<void> {
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;
  logoutError.value = '';
  try {
    const response = await authSession.logout();
    if (!response.success) {
      logoutError.value = response.message;
      return;
    }
    await router.replace({ name: 'login' });
  } catch (error) {
    logoutError.value = error instanceof Error ? error.message : 'Gagal keluar';
  } finally {
    isLoggingOut.value = false;
  }
}
</script>

<template>
  <div class="min-h-[100dvh] bg-background font-body text-foreground antialiased">
    <header class="border-b border-border bg-primary-950 text-primary-100">
      <nav class="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 lg:px-8" aria-label="Navigasi admin">
        <RouterLink to="/admin" class="flex shrink-0 items-center gap-2" aria-label="Dasbor admin">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-500 font-heading text-sm font-bold text-primary-950">S</span>
          <span class="leading-tight">
            <span class="block font-heading text-base font-semibold tracking-tight text-white">{{ SITE_NAME }}</span>
            <span class="block text-[11px] text-primary-300">Admin</span>
          </span>
        </RouterLink>
        <div class="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 lg:order-none lg:w-auto lg:flex-1 lg:pb-0">
          <template v-for="item in NAV_ITEMS" :key="item.label">
            <RouterLink
              v-if="item.to"
              :to="item.to"
              class="shrink-0 rounded-md px-3 py-2 text-sm text-primary-200 transition-colors hover:bg-white/10 hover:text-white"
              active-class="bg-white/10 text-white"
            >
              {{ item.label }}
            </RouterLink>
            <span
              v-else
              class="shrink-0 cursor-not-allowed rounded-md px-3 py-2 text-sm text-primary-300/50"
              title="Modul menyusul di M3"
            >
              {{ item.label }}
            </span>
          </template>
        </div>
        <div class="ml-auto flex shrink-0 items-center gap-2">
          <RouterLink to="/" class="whitespace-nowrap rounded-md px-3 py-2 text-sm text-primary-200 transition-colors hover:bg-white/10 hover:text-white">
            Lihat Situs
          </RouterLink>
          <button
            type="button"
            :disabled="isLoggingOut"
            class="whitespace-nowrap rounded-md px-3 py-2 text-sm text-primary-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            @click="logout"
          >
            {{ isLoggingOut ? 'Keluar…' : 'Keluar' }}
          </button>
        </div>
      </nav>
      <p v-if="logoutError" role="alert" class="mx-auto max-w-6xl px-6 pb-3 text-sm text-secondary-300 lg:px-8">
        {{ logoutError }}
      </p>
    </header>

    <slot />
  </div>
</template>
