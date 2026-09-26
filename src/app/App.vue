<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { createAnalyticsClient } from '../features/analytics/web';
import AdminShell from './layouts/AdminShell.vue';
import AuthenticatedShell from './layouts/AuthenticatedShell.vue';
import PublicShell from './layouts/PublicShell.vue';

const route = useRoute();

function initializeTheme(): void {
  let savedTheme: string | null = null;
  try {
    savedTheme = window.localStorage.getItem('sobatpaper-theme');
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }
  const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', savedTheme ? savedTheme === 'dark' : prefersDark);
}

initializeTheme();

const analytics = createAnalyticsClient();

function trackWhatsAppClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  const anchor = target?.closest?.('a[href*="wa.me"]') as HTMLAnchorElement | null;
  if (anchor) analytics.track('click_whatsapp', { path: window.location.pathname });
}

onMounted(() => {
  document.addEventListener('click', trackWhatsAppClick);
});

onUnmounted(() => {
  document.removeEventListener('click', trackWhatsAppClick);
});
</script>

<template>
  <RouterView v-slot="{ Component }">
    <AdminShell v-if="route.meta.admin">
      <component :is="Component" />
    </AdminShell>
    <AuthenticatedShell v-else-if="route.meta.requiresAuth">
      <component :is="Component" />
    </AuthenticatedShell>
    <PublicShell v-else>
      <component :is="Component" />
    </PublicShell>
  </RouterView>
</template>
