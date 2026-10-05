<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSiteSettings } from '../../../site-settings/web';
import type { Faq } from '../../contract';
import { createContentClient } from '../client';
import { setPageHead } from '../../../../shared/web/head';

setPageHead({
  title: 'FAQ — SobatPaper.id',
  description: 'Pertanyaan umum tentang konsultasi, harga, revisi, deadline, kerahasiaan, metode penelitian, dan publikasi jurnal.',
  path: '/faq',
});

const client = createContentClient();
const { consultLink, load: loadSettings } = useSiteSettings();

const faqs = ref<Faq[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');
const openFaqId = ref<string | null>(null);

function toggleFaq(id: string): void {
  openFaqId.value = openFaqId.value === id ? null : id;
}

onMounted(async () => {
  await loadSettings();
  try {
    const response = await client.faqs('umum');
    if (response.success) {
      faqs.value = response.data.faqs;
      setPageHead({
        title: 'FAQ — SobatPaper.id',
        description: 'Pertanyaan umum tentang konsultasi, harga, revisi, deadline, kerahasiaan, metode penelitian, dan publikasi jurnal.',
        path: '/faq',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: response.data.faqs.slice(0, 20).map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        },
      });
    } else errorMessage.value = response.message;
  } catch {
    errorMessage.value = 'FAQ gagal dimuat. Coba muat ulang halaman.';
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <main class="bg-[#f7f5f2] font-['Plus_Jakarta_Sans'] text-[#17191e] dark:bg-[#0d0f13] dark:text-[#f4f2ed]">
    <section class="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-24">
      <div class="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div>
          <p class="text-xs font-extrabold text-[#ff704d]">FAQ</p>
          <p class="mt-4 max-w-[300px] text-sm leading-6 text-[#777d87] dark:text-[#9da3ad]">
            Hal-hal yang paling sering ditanyakan sebelum mulai konsultasi atau pengerjaan.
          </p>
        </div>
        <h1 class="max-w-[820px] text-[clamp(3rem,6vw,5.4rem)] font-semibold leading-[0.96] tracking-[-0.06em]">
          Biar nggak ada yang <span class="font-['Instrument_Serif'] font-normal italic text-[#315bd6] dark:text-[#9eb6ff]">masih ganjel.</span>
        </h1>
      </div>

      <p v-if="isLoading" class="mt-14 text-sm text-[#747a84] dark:text-[#9da3ad]">Memuat FAQ…</p>
      <p v-else-if="errorMessage" role="alert" class="mt-14 border-y border-[#dcd8d0] py-5 text-sm dark:border-white/10">
        {{ errorMessage }}
      </p>
      <div v-else class="mt-14 grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:gap-16">
        <div class="hidden lg:block">
          <p class="max-w-[260px] text-sm leading-6 text-[#777d87] dark:text-[#9da3ad]">
            Kalau pertanyaannya belum ada di sini, langsung ceritakan konteksmu. Nggak perlu menyesuaikan diri dengan kategori tertentu.
          </p>
        </div>
        <div class="border-y border-[#dcd8d0] dark:border-white/10">
          <article v-for="faq in faqs" :key="faq.id" class="faq-row border-b border-[#dcd8d0] last:border-b-0 dark:border-white/10">
            <button
              type="button"
              class="flex w-full items-start justify-between gap-6 py-6 text-left sm:py-7"
              :aria-expanded="openFaqId === faq.id"
              :aria-controls="`faq-page-answer-${faq.id}`"
              @click="toggleFaq(faq.id)"
            >
              <span class="max-w-[680px] text-[16px] font-bold leading-6 tracking-[-0.02em] sm:text-[18px]">{{ faq.question }}</span>
              <span class="faq-icon shrink-0 text-xl text-[#777d87] dark:text-[#9da3ad]" :class="{ 'is-open': openFaqId === faq.id }" aria-hidden="true">+</span>
            </button>
            <div :id="`faq-page-answer-${faq.id}`" class="faq-panel" :class="{ 'is-open': openFaqId === faq.id }">
              <div class="min-h-0 overflow-hidden">
                <p class="max-w-[720px] pb-7 text-sm leading-7 text-[#707680] dark:text-[#9ca2ac]">{{ faq.answer }}</p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <section class="mt-16 grid overflow-hidden rounded-[2rem] bg-[#1f3167] text-white dark:bg-[#18254f] lg:grid-cols-[1fr_auto] lg:items-center" aria-label="Bantuan lanjutan">
        <div class="px-6 py-9 sm:px-9 lg:px-10">
          <p class="text-xs font-bold text-[#ffb49f]">Belum ketemu jawabannya?</p>
          <h2 class="mt-3 text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.045em]">Ceritakan aja konteksnya.</h2>
        </div>
        <div class="border-t border-white/10 px-6 py-7 sm:px-9 lg:border-l lg:border-t-0 lg:px-10 lg:py-10">
          <a :href="consultLink" target="_blank" rel="noreferrer" class="inline-flex rounded-[1rem] bg-[#f7f5f2] px-6 py-3.5 text-sm font-bold text-[#1f3167] transition-transform hover:-translate-y-0.5">
            Mulai konsultasi
          </a>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.faq-panel {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 380ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease;
}

.faq-panel.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.faq-icon {
  transition: transform 380ms cubic-bezier(0.22, 1, 0.36, 1);
}

.faq-icon.is-open {
  transform: rotate(45deg);
}

@media (prefers-reduced-motion: reduce) {
  .faq-panel,
  .faq-icon {
    transition-duration: 0.01ms;
  }
}
</style>
