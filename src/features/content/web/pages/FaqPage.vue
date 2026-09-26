<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSiteSettings } from '../../../site-settings/web';
import type { Faq } from '../../contract';
import { createContentClient } from '../client';

const client = createContentClient();
const { consultLink, load: loadSettings } = useSiteSettings();

const faqs = ref<Faq[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  await loadSettings();
  try {
    const response = await client.faqs('umum');
    if (response.success) faqs.value = response.data.faqs;
    else errorMessage.value = response.message;
  } catch {
    errorMessage.value = 'FAQ gagal dimuat. Coba muat ulang halaman.';
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <main class="mx-auto max-w-3xl px-6 py-12 lg:py-16">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">FAQ</p>
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
      Pertanyaan yang sering ditanyakan
    </h1>

    <p v-if="isLoading" class="mt-10 text-sm text-muted-foreground">Memuat FAQ…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-10 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
      {{ errorMessage }}
    </p>
    <div v-else class="mt-10 space-y-3">
      <details v-for="faq in faqs" :key="faq.id" class="rounded-xl border border-border bg-card px-5 py-4 shadow-soft">
        <summary class="cursor-pointer text-sm font-medium sm:text-base">{{ faq.question }}</summary>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">{{ faq.answer }}</p>
      </details>
    </div>

    <section class="mt-12 rounded-2xl border border-border bg-muted/40 p-6 text-center" aria-label="Bantuan lanjutan">
      <h2 class="font-heading text-lg font-semibold tracking-tight">Masih ada pertanyaan?</h2>
      <p class="mt-2 text-sm text-muted-foreground">Chat langsung — konsultasi awal gratis.</p>
      <a
        :href="consultLink"
        target="_blank"
        rel="noreferrer"
        class="mt-5 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Konsultasi Sekarang
      </a>
    </section>
  </main>
</template>
