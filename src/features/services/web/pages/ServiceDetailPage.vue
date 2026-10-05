<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useSiteSettings } from '../../../site-settings/web';
import { createAnalyticsClient } from '../../../analytics/web';
import type { ServiceDetail } from '../../contract';
import { createServicesClient } from '../client';
import { formatIDR } from '../format';
import { setPageHead } from '../../../../shared/web/head';

const client = createServicesClient();
const analytics = createAnalyticsClient();
const route = useRoute();
const router = useRouter();
const { load: loadSettings } = useSiteSettings();

const service = ref<ServiceDetail | null>(null);
const isLoading = ref(true);
const errorMessage = ref('');

const paragraphs = computed(() => (service.value?.description ?? '').split('\n\n').filter(Boolean));

async function loadDetail(slug: string): Promise<void> {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await client.detail(slug);
    if (response.success) {
      service.value = response.data.service;
      setPageHead({
        title: `${response.data.service.name} — SobatPaper.id`,
        description: response.data.service.tagline,
        path: `/layanan/${response.data.service.slug}`,
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: response.data.service.name,
            description: response.data.service.tagline,
            provider: { '@type': 'Organization', name: 'SobatPaper.id' },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Layanan',
                item: `${window.location.origin}/layanan`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: response.data.service.name,
                item: `${window.location.origin}/layanan/${response.data.service.slug}`,
              },
            ],
          },
        ],
      });
      analytics.track('view_service', { service: response.data.service.slug });
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
  <main v-if="service" class="bg-[#f7f5f2] font-['Plus_Jakarta_Sans'] text-[#17191e] dark:bg-[#0d0f13] dark:text-[#f4f2ed]">
    <section class="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-24">
      <nav aria-label="Breadcrumb" class="text-xs font-semibold text-[#858b94] dark:text-[#8f959f]">
        <RouterLink to="/layanan" class="transition hover:text-[#17191e] dark:hover:text-white">Layanan</RouterLink>
        <span class="mx-2" aria-hidden="true">/</span>
        <span class="text-[#555b65] dark:text-[#b7bbc2]">{{ service.name }}</span>
      </nav>

      <div class="mt-8 grid gap-14 lg:grid-cols-[1.34fr_0.66fr] lg:gap-16">
        <div>
          <p class="text-xs font-extrabold text-[#ff704d]">Detail layanan</p>
          <h1 class="mt-4 max-w-[820px] text-[clamp(3rem,6vw,5.35rem)] font-semibold leading-[0.96] tracking-[-0.06em]">{{ service.name }}</h1>
          <p class="mt-5 max-w-[720px] text-[17px] leading-8 text-[#666c76] dark:text-[#a5abb4]">{{ service.tagline }}</p>

          <div class="mt-10 max-w-[760px] space-y-5 text-[15px] leading-8 text-[#555b65] dark:text-[#b1b6bf]">
            <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
          </div>

          <section class="mt-14" aria-labelledby="scope-title">
            <div class="border-b border-[#dcd8d0] pb-4 dark:border-white/10">
              <p class="text-xs font-extrabold text-[#ff704d]">Cakupan</p>
              <h2 id="scope-title" class="mt-3 text-[clamp(1.8rem,3vw,2.5rem)] font-bold tracking-[-0.04em]">Yang termasuk di dalamnya</h2>
            </div>
            <ul class="border-b border-[#dcd8d0] dark:border-white/10">
              <li v-for="(item, index) in service.scope" :key="item" class="grid gap-4 border-b border-[#dcd8d0] py-5 last:border-b-0 dark:border-white/10 sm:grid-cols-[48px_1fr]">
                <span class="text-xs font-bold tabular-nums text-[#a29c92] dark:text-[#777d87]">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="text-sm leading-7 text-[#555b65] dark:text-[#b1b6bf] sm:text-[15px]">{{ item }}</span>
              </li>
            </ul>
          </section>

          <section class="mt-14" aria-labelledby="process-title">
            <div class="border-b border-[#dcd8d0] pb-4 dark:border-white/10">
              <p class="text-xs font-extrabold text-[#ff704d]">Proses</p>
              <h2 id="process-title" class="mt-3 text-[clamp(1.8rem,3vw,2.5rem)] font-bold tracking-[-0.04em]">Cara pengerjaannya</h2>
            </div>
            <ol class="border-b border-[#dcd8d0] dark:border-white/10">
              <li v-for="(step, index) in service.process" :key="step" class="grid gap-4 border-b border-[#dcd8d0] py-5 last:border-b-0 dark:border-white/10 sm:grid-cols-[48px_1fr]">
                <span class="text-xs font-bold tabular-nums text-[#a29c92] dark:text-[#777d87]">{{ String(index + 1).padStart(2, '0') }}</span>
                <p class="text-sm leading-7 text-[#555b65] dark:text-[#b1b6bf] sm:text-[15px]">{{ step }}</p>
              </li>
            </ol>
          </section>

          <section v-if="service.faqs.length > 0" class="mt-14" aria-labelledby="faq-title">
            <p class="text-xs font-extrabold text-[#ff704d]">FAQ layanan</p>
            <h2 id="faq-title" class="mt-3 text-[clamp(1.8rem,3vw,2.5rem)] font-bold tracking-[-0.04em]">Yang sering ditanyakan</h2>
            <div class="mt-5 border-y border-[#dcd8d0] dark:border-white/10">
              <details v-for="faq in service.faqs" :key="faq.question" class="group border-b border-[#dcd8d0] last:border-b-0 dark:border-white/10">
                <summary class="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-sm font-bold marker:hidden sm:text-[15px]">
                  {{ faq.question }}
                  <span class="text-lg text-[#777d87] transition-transform group-open:rotate-45 dark:text-[#9da3ad]">+</span>
                </summary>
                <p class="max-w-[680px] pb-5 text-sm leading-7 text-[#707680] dark:text-[#9ca2ac]">{{ faq.answer }}</p>
              </details>
            </div>
          </section>
        </div>

        <aside aria-label="Ringkasan layanan">
          <div class="border-y border-[#dcd8d0] py-6 dark:border-white/10 lg:sticky lg:top-24">
            <div class="grid grid-cols-2 gap-6">
              <div>
                <p class="text-xs font-semibold text-[#858b94] dark:text-[#8f959f]">Harga mulai</p>
                <p class="mt-2 text-xl font-bold tracking-[-0.035em]">{{ formatIDR(service.startingPrice) }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold text-[#858b94] dark:text-[#8f959f]">Estimasi waktu</p>
                <p class="mt-2 text-sm font-bold leading-6">{{ service.estimatedTime }}</p>
              </div>
            </div>

            <div class="mt-7 space-y-3">
              <RouterLink :to="{ name: 'consultation', query: { service: service.slug } }" class="block rounded-[1rem] bg-[#17191e] px-5 py-3.5 text-center text-sm font-bold text-white transition-transform hover:-translate-y-0.5 dark:bg-[#f4f2ed] dark:text-[#17191e]">
                Konsultasi sekarang
              </RouterLink>
              <RouterLink :to="`/order?service=${service.slug}`" class="block rounded-[1rem] border border-[#d4d0c8] px-5 py-3.5 text-center text-sm font-bold transition hover:border-[#a9a39a] dark:border-white/15 dark:hover:border-white/30">
                Pesan layanan
              </RouterLink>
              <RouterLink to="/harga" class="block px-2 py-2 text-center text-sm font-bold text-[#315bd6] dark:text-[#9eb6ff]">
                Lihat semua harga →
              </RouterLink>
            </div>

            <p v-if="service.disclaimer" class="mt-6 border-t border-[#dcd8d0] pt-5 text-xs leading-6 text-[#777d87] dark:border-white/10 dark:text-[#9da3ad]">
              {{ service.disclaimer }}
            </p>
          </div>
        </aside>
      </div>
    </section>
  </main>
  <main v-else class="min-h-[60vh] bg-[#f7f5f2] px-6 py-16 font-['Plus_Jakarta_Sans'] text-[#17191e] dark:bg-[#0d0f13] dark:text-[#f4f2ed] lg:px-10">
    <div class="mx-auto max-w-[1240px]">
      <p v-if="isLoading" class="text-sm text-[#747a84] dark:text-[#9da3ad]">Memuat layanan…</p>
      <p v-else-if="errorMessage" role="alert" class="border-y border-[#dcd8d0] py-5 text-sm dark:border-white/10">{{ errorMessage }}</p>
    </div>
  </main>
</template>
