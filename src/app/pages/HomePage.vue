<script setup lang="ts">
import { RouterLink } from 'vue-router';
import PublicShell from '../layouts/PublicShell.vue';
import { SITE_TAGLINE, buildWhatsAppLink } from '../site';

const consultLink = buildWhatsAppLink();

interface TrustItem {
  title: string;
  description: string;
  path: string;
}

const TRUST_ITEMS: readonly TrustItem[] = [
  {
    title: 'Profesional',
    description: 'Dikerjakan dengan standar akademik oleh tim yang berpengalaman.',
    path: 'M4 7h16v12H4zM9 7V5h6v2M9 12h6',
  },
  {
    title: 'Terpercaya',
    description: 'Proses jelas, dokumen rahasia, dan komunikasi terbuka.',
    path: 'M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6zM9 12l2 2 4-4',
  },
  {
    title: 'Tepat Waktu',
    description: 'Deadline disepakati di awal dan dikawal sampai final.',
    path: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4l3 2',
  },
  {
    title: 'Konsultasi',
    description: 'Diskusi kebutuhan riset sampai scope dan biayanya jelas.',
    path: 'M4 6h16v9H9l-5 4zM8 10h8M8 13h5',
  },
  {
    title: 'Transparan',
    description: 'Rincian pekerjaan dan estimasi biaya terbuka sejak awal.',
    path: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h6M9 16h6',
  },
];

const SERVICE_TEASERS: readonly { title: string; description: string }[] = [
  { title: 'Pendampingan Skripsi', description: 'Topik, kerangka, metodologi, sampai persiapan revisi.' },
  { title: 'Pendampingan Tesis', description: 'Pendampingan S2 yang rapi dari proposal hingga akhir.' },
  { title: 'Analisis Data Penelitian', description: 'SPSS, Jamovi, SmartPLS, R — deskriptif hingga SEM/PLS.' },
  { title: 'Editing & Formatting', description: 'Proofreading, template kampus/jurnal, APA 7, sitasi.' },
  { title: 'Konversi Skripsi/Tesis → Artikel', description: 'Naskah diolah menjadi artikel siap submit SINTA.' },
  { title: 'Artikel Ilmiah', description: 'Penulisan dan pendampingan artikel berbasis data riset.' },
];
</script>

<template>
  <PublicShell>
    <main>
      <section class="bg-primary-950 text-white">
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <p class="font-heading text-xs uppercase tracking-[0.25em] text-secondary-300">{{ SITE_TAGLINE }}</p>
            <h1 class="mt-4 font-heading text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Pendampingan Riset &amp; Penulisan Akademik
            </h1>
            <p class="mt-5 max-w-xl text-base leading-relaxed text-primary-100 sm:text-lg">
              SobatPaper membantu penelitian, analisis data, penulisan ilmiah, editing,
              dan publikasi artikel jurnal — untuk mahasiswa, guru, dosen, dan peneliti.
            </p>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                :href="consultLink"
                target="_blank"
                rel="noreferrer"
                class="rounded-lg bg-secondary-500 px-6 py-3 text-center text-sm font-semibold text-primary-950 transition-opacity hover:opacity-90"
              >
                Konsultasi Sekarang
              </a>
              <RouterLink
                to="/layanan"
                class="rounded-lg border border-white/25 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Lihat Layanan
              </RouterLink>
            </div>
          </div>
          <div class="hidden rounded-2xl border border-white/10 bg-white/5 p-8 lg:block" aria-hidden="true">
            <div class="rounded-xl bg-white p-6 shadow-xl">
              <div class="h-3 w-2/3 rounded bg-primary-900"></div>
              <div class="mt-3 h-2 w-full rounded bg-primary-100"></div>
              <div class="mt-2 h-2 w-11/12 rounded bg-primary-100"></div>
              <div class="mt-2 h-2 w-full rounded bg-primary-100"></div>
              <div class="mt-5 flex items-end gap-2">
                <div class="w-1/5 rounded-t bg-primary-200" style="height: 48px"></div>
                <div class="w-1/5 rounded-t bg-primary-400" style="height: 72px"></div>
                <div class="w-1/5 rounded-t bg-primary-700" style="height: 96px"></div>
                <div class="w-1/5 rounded-t bg-secondary-500" style="height: 120px"></div>
                <div class="w-1/5 rounded-t bg-primary-900" style="height: 84px"></div>
              </div>
              <div class="mt-4 flex items-center gap-2">
                <div class="h-6 w-6 rounded-full bg-secondary-500"></div>
                <div class="h-2 w-1/3 rounded bg-primary-100"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="border-b border-border" aria-label="Keunggulan SobatPaper">
        <div class="mx-auto grid max-w-6xl gap-6 px-6 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
          <article v-for="item in TRUST_ITEMS" :key="item.title" class="flex flex-col gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-800">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path :d="item.path" />
              </svg>
            </span>
            <h2 class="font-heading text-base font-semibold tracking-tight">{{ item.title }}</h2>
            <p class="text-sm leading-relaxed text-muted-foreground">{{ item.description }}</p>
          </article>
        </div>
      </section>

      <section class="mx-auto max-w-6xl px-6 py-16 lg:px-8" aria-labelledby="layanan-title">
        <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Layanan Akademik</p>
        <h2 id="layanan-title" class="mt-3 font-heading text-3xl font-semibold tracking-tight">
          Pendampingan untuk setiap tahap riset
        </h2>
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RouterLink
            v-for="service in SERVICE_TEASERS"
            :key="service.title"
            to="/layanan"
            class="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-colors hover:border-primary/40"
          >
            <h3 class="font-heading text-lg font-semibold tracking-tight group-hover:text-primary">{{ service.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-muted-foreground">{{ service.description }}</p>
          </RouterLink>
        </div>
      </section>

      <section class="border-y border-border bg-muted/40" aria-labelledby="cta-title">
        <div class="mx-auto max-w-6xl px-6 py-16 text-center lg:px-8">
          <h2 id="cta-title" class="mx-auto max-w-2xl font-heading text-3xl font-semibold tracking-tight">
            Ceritakan kebutuhan riset kamu, kami bantu petakan jalannya
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Konsultasi awal gratis — sampaikan topik, metode, dan deadline, lalu terima
            estimasi biaya yang transparan.
          </p>
          <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              :href="consultLink"
              target="_blank"
              rel="noreferrer"
              class="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Konsultasi Sekarang
            </a>
            <RouterLink
              to="/harga"
              class="rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:border-primary/40"
            >
              Lihat Harga
            </RouterLink>
          </div>
        </div>
      </section>
    </main>
  </PublicShell>
</template>
