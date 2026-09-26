<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useSiteSettings } from '../../../site-settings/web';

const { consultLink } = useSiteSettings();

const STEPS: readonly { title: string; description: string }[] = [
  { title: 'Konsultasi', description: 'Ceritakan kebutuhan, topik, metode, dan deadline lewat WhatsApp atau form order.' },
  { title: 'Kirim kebutuhan & dokumen', description: 'Unggah naskah, data, dan panduan kampus atau template jurnal yang kamu punya.' },
  { title: 'Analisis scope', description: 'Kami petakan pekerjaan, kelayakan data, dan estimasi waktunya.' },
  { title: 'Penawaran harga', description: 'Kamu terima rincian scope dan harga final yang transparan sebelum komit.' },
  { title: 'Pembayaran', description: 'Pengerjaan dijadwalkan setelah pembayaran sesuai kesepakatan.' },
  { title: 'Pengerjaan', description: 'Tim mengerjakan sesuai milestone dengan update progres berkala.' },
  { title: 'Review & revisi', description: 'Hasil direview bersama; revisi dikerjakan dalam window yang disepakati.' },
  { title: 'Final', description: 'File final diserahkan lengkap dengan output pendukungnya.' },
];
</script>

<template>
  <main class="mx-auto max-w-3xl px-6 py-12 lg:py-16">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Cara Kerja</p>
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
      Alur pemesanan yang sederhana
    </h1>
    <p class="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
      Delapan langkah dari konsultasi sampai file final — selalu transparan di setiap tahap.
    </p>

    <ol class="mt-10">
      <li v-for="(step, index) in STEPS" :key="step.title" class="relative flex gap-5 pb-8 last:pb-0">
        <div class="flex flex-col items-center" aria-hidden="true">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground">
            {{ index + 1 }}
          </span>
          <span v-if="index < STEPS.length - 1" class="mt-2 w-px flex-1 bg-border"></span>
        </div>
        <div class="pb-1">
          <h2 class="font-heading text-lg font-semibold tracking-tight">{{ step.title }}</h2>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">{{ step.description }}</p>
        </div>
      </li>
    </ol>

    <div class="mt-12 flex flex-col gap-3 sm:flex-row">
      <a
        :href="consultLink"
        target="_blank"
        rel="noreferrer"
        class="rounded-lg bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Mulai Konsultasi
      </a>
      <RouterLink
        to="/harga"
        class="rounded-lg border border-border px-6 py-3 text-center text-sm font-semibold transition-colors hover:border-primary/40"
      >
        Lihat Harga
      </RouterLink>
    </div>
  </main>
</template>
