<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useSiteSettings } from '../../../site-settings/web';
import type { ServiceDetail } from '../../contract';
import { createServicesClient } from '../client';
import { formatIDR } from '../format';

const client = createServicesClient();
const route = useRoute();
const router = useRouter();
const { linkFor, load: loadSettings } = useSiteSettings();

const service = ref<ServiceDetail | null>(null);
const isLoading = ref(true);
const errorMessage = ref('');

const paragraphs = computed(() => (service.value?.description ?? '').split('\n\n').filter(Boolean));
const consultHref = computed(() =>
  service.value
    ? linkFor(`Halo SobatPaper, saya ingin konsultasi layanan ${service.value.name}. Mohon informasi estimasi biaya dan prosesnya.`)
    : '#',
);

async function loadDetail(slug: string): Promise<void> {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await client.detail(slug);
    if (response.success) {
      service.value = response.data.service;
    } else if (!response.success && response.code === 'NOT_FOUND') {
      await router.replace({ name: 'not-found' });
      return;
    } else {
      errorMessage.value = response.message;
    }
  } catch {
    errorMessage.value = 'Detail layanan gagal dimuat. Coba muat ulang halaman.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await loadSettings();
  await loadDetail(route.params.slug as string);
});

watch(
  () => route.params.slug,
  async (slug) => {
    if (typeof slug === 'string') await loadDetail(slug);
  },
);
</script>

<template>
  <main v-if="service" class="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
    <nav aria-label="Breadcrumb" class="text-sm text-muted-foreground">
      <RouterLink to="/layanan" class="hover:text-foreground">Layanan</RouterLink>
      <span aria-hidden="true"> / </span>
      <span class="text-foreground">{{ service.name }}</span>
    </nav>

    <div class="mt-6 grid gap-10 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <h1 class="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{{ service.name }}</h1>
        <p class="mt-3 text-lg text-muted-foreground">{{ service.tagline }}</p>
        <div class="mt-6 space-y-4 text-base leading-relaxed">
          <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
        </div>

        <section class="mt-10" aria-labelledby="scope-title">
          <h2 id="scope-title" class="font-heading text-xl font-semibold tracking-tight">Cakupan pekerjaan</h2>
          <ul class="mt-4 space-y-2">
            <li v-for="item in service.scope" :key="item" class="flex gap-3 text-sm leading-relaxed sm:text-base">
              <span class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-800" aria-hidden="true">✓</span>
              {{ item }}
            </li>
          </ul>
        </section>

        <section class="mt-10" aria-labelledby="process-title">
          <h2 id="process-title" class="font-heading text-xl font-semibold tracking-tight">Proses pengerjaan</h2>
          <ol class="mt-4 space-y-0">
            <li v-for="(step, index) in service.process" :key="step" class="relative flex gap-4 pb-5 last:pb-0">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-xs font-semibold text-primary-foreground" aria-hidden="true">
                {{ index + 1 }}
              </span>
              <p class="pt-1 text-sm leading-relaxed sm:text-base">{{ step }}</p>
            </li>
          </ol>
        </section>

        <section v-if="service.faqs.length > 0" class="mt-10" aria-labelledby="faq-title">
          <h2 id="faq-title" class="font-heading text-xl font-semibold tracking-tight">Pertanyaan umum</h2>
          <div class="mt-4 space-y-3">
            <details v-for="faq in service.faqs" :key="faq.question" class="rounded-xl border border-border bg-card px-5 py-4">
              <summary class="cursor-pointer text-sm font-medium sm:text-base">{{ faq.question }}</summary>
              <p class="mt-2 text-sm leading-relaxed text-muted-foreground">{{ faq.answer }}</p>
            </details>
          </div>
        </section>
      </div>

      <aside class="lg:pt-1" aria-label="Ringkasan layanan">
        <div class="rounded-2xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-24">
          <p class="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">Harga mulai</p>
          <p class="mt-2 font-heading text-2xl font-semibold tracking-tight">{{ formatIDR(service.startingPrice) }}</p>
          <p class="mt-4 font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">Estimasi waktu</p>
          <p class="mt-2 text-sm leading-relaxed">{{ service.estimatedTime }}</p>
          <div class="mt-6 space-y-3">
            <a
              :href="consultHref"
              target="_blank"
              rel="noreferrer"
              class="block rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Konsultasi Sekarang
            </a>
            <RouterLink
              :to="`/order?service=${service.slug}`"
              class="block rounded-lg bg-secondary-500 px-4 py-3 text-center text-sm font-semibold text-primary-950 transition-opacity hover:opacity-90"
            >
              Pesan Sekarang
            </RouterLink>
            <RouterLink
              to="/harga"
              class="block text-center text-sm font-semibold text-primary hover:underline"
            >
              Lihat Harga
            </RouterLink>
          </div>
        </div>
        <p v-if="service.disclaimer" class="mt-4 rounded-xl border border-secondary-500/40 bg-secondary-50 p-4 text-xs leading-relaxed text-secondary-800">
          {{ service.disclaimer }}
        </p>
      </aside>
    </div>
  </main>
  <main v-else class="mx-auto max-w-6xl px-6 py-12 lg:px-8">
    <p v-if="isLoading" class="text-sm text-muted-foreground">Memuat layanan…</p>
    <p v-else-if="errorMessage" role="alert" class="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
      {{ errorMessage }}
    </p>
  </main>
</template>
