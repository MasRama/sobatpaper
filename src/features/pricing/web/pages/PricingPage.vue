<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { formatIDR } from '../../../services/web';
import { useSiteSettings } from '../../../site-settings/web';
import { EstimationCalculator } from '../../../estimation/web';
import type { PricingGroup } from '../../contract';
import { createPricingClient } from '../client';
import { createAnalyticsClient } from '../../../analytics/web';
import { setPageHead } from '../../../../shared/web/head';

setPageHead({
  title: 'Harga Layanan — SobatPaper.id',
  description: 'Harga transparan pendampingan skripsi, tesis, analisis data, editing, dan publikasi artikel jurnal SINTA.',
  path: '/harga',
});

const client = createPricingClient();
const analytics = createAnalyticsClient();
const { consultLink, load: loadSettings } = useSiteSettings();

const groups = ref<PricingGroup[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  analytics.track('view_price', {});
  await loadSettings();
  try {
    const response = await client.list();
    if (response.success) groups.value = response.data.groups;
    else errorMessage.value = response.message;
  } catch {
    errorMessage.value = 'Daftar harga gagal dimuat. Coba muat ulang halaman.';
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
          <p class="text-xs font-extrabold text-[#ff704d]">Harga</p>
          <p class="mt-4 max-w-[310px] text-sm leading-6 text-[#777d87] dark:text-[#9da3ad]">
            Harga di bawah adalah titik awal. Scope final tetap dibahas dulu sebelum pengerjaan dimulai.
          </p>
        </div>
        <div>
          <h1 class="max-w-[820px] text-[clamp(3rem,6vw,5.4rem)] font-semibold leading-[0.96] tracking-[-0.06em]">
            Angkanya jelas dari awal. <span class="font-['Instrument_Serif'] font-normal italic text-[#315bd6] dark:text-[#9eb6ff]">Nggak ada biaya siluman.</span>
          </h1>
        </div>
      </div>

      <p v-if="isLoading" class="mt-14 text-sm text-[#747a84] dark:text-[#9da3ad]">Memuat harga…</p>
      <p v-else-if="errorMessage" role="alert" class="mt-14 border-y border-[#dcd8d0] py-5 text-sm dark:border-white/10">
        {{ errorMessage }}
      </p>
      <div v-else class="mt-14 space-y-14">
        <section v-for="group in groups" :key="group.slug" :aria-labelledby="`harga-${group.slug}`">
          <div class="flex items-end justify-between gap-6 border-b border-[#dcd8d0] pb-4 dark:border-white/10">
            <h2 :id="`harga-${group.slug}`" class="text-[clamp(1.7rem,3vw,2.5rem)] font-bold tracking-[-0.04em]">{{ group.name }}</h2>
            <span class="text-xs font-semibold text-[#8b9099] dark:text-[#8f959f]">mulai dari</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-sm">
            <thead class="sr-only">
              <tr>
                <th scope="col">Paket</th>
                <th scope="col">Harga</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#dcd8d0] dark:divide-white/10">
              <tr v-for="item in group.packages" :key="item.id" class="transition-colors hover:bg-white/45 dark:hover:bg-white/[0.025]">
                <td class="py-5 pr-6">
                  <p class="font-bold tracking-[-0.02em]">{{ item.name }}</p>
                  <p v-if="item.note" class="mt-1.5 max-w-[620px] text-xs leading-5 text-[#777d87] dark:text-[#9da3ad]">{{ item.note }}</p>
                </td>
                <td class="whitespace-nowrap py-5 text-right">
                  <p class="font-bold">{{ formatIDR(item.price) }}</p>
                  <p v-if="item.unit" class="mt-0.5 text-xs text-[#858b94] dark:text-[#8f959f]">{{ item.unit }}</p>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </section>
      </div>

      <section class="mt-16 grid overflow-hidden rounded-[2rem] bg-[#1f3167] text-white dark:bg-[#18254f] lg:grid-cols-[0.88fr_1.12fr]" aria-label="Ketentuan harga">
        <div class="px-6 py-9 sm:px-9 lg:px-10 lg:py-11">
          <p class="text-xs font-bold text-[#ffb49f]">Ketentuan harga</p>
          <h2 class="mt-4 text-[clamp(2rem,3.4vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
            Finalnya tetap dibahas <span class="font-['Instrument_Serif'] font-normal italic text-[#ffd2c5]">sebelum mulai.</span>
          </h2>
        </div>
        <div class="border-t border-white/10 px-6 py-9 sm:px-9 lg:border-l lg:border-t-0 lg:px-10 lg:py-11">
          <ul class="space-y-3 text-sm leading-7 text-white/75">
            <li>Harga dapat berubah sesuai bidang, tingkat kesulitan, jumlah halaman, metode penelitian, kondisi data, dan deadline.</li>
            <li>Biaya publikasi/APC jurnal tidak termasuk, kecuali dinyatakan eksplisit dalam paket.</li>
            <li>Harga final selalu disepakati tertulis sebelum pengerjaan dimulai.</li>
          </ul>
          <div class="mt-7 flex flex-col gap-3 sm:flex-row">
            <RouterLink to="/order" class="rounded-[1rem] bg-[#f7f5f2] px-6 py-3 text-center text-sm font-bold text-[#1f3167] transition-transform hover:-translate-y-0.5">
              Pesan sekarang
            </RouterLink>
            <a :href="consultLink" target="_blank" rel="noreferrer" class="px-2 py-3 text-center text-sm font-bold text-white/85 transition hover:text-white">
              Konsultasikan kebutuhanmu →
            </a>
          </div>
        </div>
      </section>

      <div class="mt-16 border-t border-[#dcd8d0] pt-12 dark:border-white/10">
        <EstimationCalculator />
      </div>
    </section>
  </main>
</template>
