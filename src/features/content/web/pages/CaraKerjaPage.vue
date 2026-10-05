<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useSiteSettings } from '../../../site-settings/web';
import { setPageHead } from '../../../../shared/web/head';

setPageHead({
  title: 'Cara Kerja — SobatPaper.id',
  description: 'Delapan langkah sederhana dari konsultasi sampai file final: scope jelas, harga transparan, revisi terstruktur.',
  path: '/cara-kerja',
});

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
  <main class="bg-[#f7f5f2] font-['Plus_Jakarta_Sans'] text-[#17191e] dark:bg-[#0d0f13] dark:text-[#f4f2ed]">
    <section class="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-24">
      <div class="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div>
          <p class="text-xs font-extrabold text-[#ff704d]">Cara kerja</p>
          <p class="mt-4 max-w-[310px] text-sm leading-6 text-[#777d87] dark:text-[#9da3ad]">
            Dari cerita awal sampai file final, setiap tahap dibuat jelas supaya kamu tahu apa yang sedang berjalan.
          </p>
        </div>
        <h1 class="max-w-[820px] text-[clamp(3rem,6vw,5.4rem)] font-semibold leading-[0.96] tracking-[-0.06em]">
          Nggak perlu nebak-nebak <span class="font-['Instrument_Serif'] font-normal italic text-[#315bd6] dark:text-[#9eb6ff]">prosesnya sampai mana.</span>
        </h1>
      </div>

      <ol class="mt-14 border-y border-[#dcd8d0] dark:border-white/10">
        <li
          v-for="(step, index) in STEPS"
          :key="step.title"
          class="grid gap-4 border-b border-[#dcd8d0] py-7 last:border-b-0 dark:border-white/10 sm:grid-cols-[60px_0.72fr_1.28fr] sm:items-start sm:gap-8 lg:py-8"
        >
          <span class="text-xs font-bold tabular-nums text-[#a29c92] dark:text-[#777d87]">{{ String(index + 1).padStart(2, '0') }}</span>
          <h2 class="text-[clamp(1.35rem,2vw,1.8rem)] font-bold tracking-[-0.035em]">{{ step.title }}</h2>
          <p class="max-w-[650px] text-sm leading-7 text-[#707680] dark:text-[#9ca2ac] sm:text-[15px]">{{ step.description }}</p>
        </li>
      </ol>

      <div class="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a :href="consultLink" target="_blank" rel="noreferrer" class="rounded-[1rem] bg-[#17191e] px-6 py-3.5 text-center text-sm font-bold text-white transition-transform hover:-translate-y-0.5 dark:bg-[#f4f2ed] dark:text-[#17191e]">
          Mulai konsultasi
        </a>
        <RouterLink to="/harga" class="px-3 py-3.5 text-center text-sm font-bold text-[#555b65] transition hover:text-[#17191e] dark:text-[#a5abb4] dark:hover:text-white">
          Lihat harga →
        </RouterLink>
      </div>
    </section>
  </main>
</template>
