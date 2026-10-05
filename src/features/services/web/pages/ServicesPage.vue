<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import type { ServiceSummary } from '../../contract';
import { createServicesClient } from '../client';
import { formatIDR } from '../format';
import { setPageHead } from '../../../../shared/web/head';

setPageHead({
  title: 'Layanan Akademik — SobatPaper.id',
  description: 'Pendampingan skripsi, tesis, analisis data, editing & formatting, konversi jurnal, dan penulisan artikel ilmiah.',
  path: '/layanan',
});

const client = createServicesClient();
const services = ref<ServiceSummary[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  try {
    const response = await client.list();
    if (response.success) services.value = response.data.services;
    else errorMessage.value = response.message;
  } catch {
    errorMessage.value = 'Daftar layanan gagal dimuat. Coba muat ulang halaman.';
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <main class="bg-[#f7f5f2] font-['Plus_Jakarta_Sans'] text-[#17191e] dark:bg-[#0d0f13] dark:text-[#f4f2ed]">
    <section class="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-24">
      <div class="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
        <div>
          <p class="text-xs font-extrabold text-[#ff704d]">Layanan</p>
          <p class="mt-4 max-w-[300px] text-sm leading-6 text-[#777d87] dark:text-[#9da3ad]">
            Nggak harus tahu nama layanannya dari awal. Ceritakan kondisimu, lalu pilih yang paling relevan.
          </p>
        </div>
        <div>
          <h1 class="max-w-[820px] text-[clamp(3rem,6vw,5.4rem)] font-semibold leading-[0.96] tracking-[-0.06em]">
            Datang bawa masalahnya. <span class="font-['Instrument_Serif'] font-normal italic text-[#315bd6] dark:text-[#9eb6ff]">Kita cari titik beresnya.</span>
          </h1>
        </div>
      </div>

      <p v-if="isLoading" class="mt-14 text-sm text-[#747a84] dark:text-[#9da3ad]">Memuat layanan…</p>
      <p v-else-if="errorMessage" role="alert" class="mt-14 border-y border-[#dcd8d0] py-5 text-sm dark:border-white/10">
        {{ errorMessage }}
      </p>
      <div v-else class="mt-14 border-y border-[#dcd8d0] dark:border-white/10">
        <RouterLink
          v-for="(service, index) in services"
          :key="service.slug"
          :to="`/layanan/${service.slug}`"
          class="group grid gap-5 border-b border-[#dcd8d0] py-7 last:border-b-0 dark:border-white/10 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center sm:gap-7 lg:py-8"
        >
          <span class="text-xs font-bold tabular-nums text-[#a29c92] dark:text-[#777d87]">{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <h2 class="text-[clamp(1.4rem,2.2vw,2rem)] font-bold tracking-[-0.035em] transition-colors group-hover:text-[#315bd6] dark:group-hover:text-[#9eb6ff]">
              {{ service.name }}
            </h2>
            <p class="mt-2 max-w-[690px] text-sm leading-6 text-[#707680] dark:text-[#9ca2ac]">{{ service.tagline }}</p>
          </div>
          <div class="flex items-end justify-between gap-8 sm:block sm:min-w-[170px] sm:text-right">
            <p class="text-sm font-bold">{{ formatIDR(service.startingPrice) }}</p>
            <p class="mt-1 text-xs text-[#858b94] dark:text-[#8f959f]">{{ service.estimatedTime }}</p>
            <span class="mt-3 inline-block text-lg transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
          </div>
        </RouterLink>
      </div>
    </section>
  </main>
</template>
