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
  <main class="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Harga Transparan</p>
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
      Paket dan harga layanan
    </h1>
    <p class="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
      Semua harga di bawah adalah harga mulai. Estimasi final dihitung dari scope
      aktual setelah konsultasi — tanpa biaya siluman.
    </p>

    <p v-if="isLoading" class="mt-10 text-sm text-muted-foreground">Memuat harga…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-10 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
      {{ errorMessage }}
    </p>
    <div v-else class="mt-10 space-y-10">
      <section v-for="group in groups" :key="group.slug" :aria-labelledby="`harga-${group.slug}`">
        <h2 :id="`harga-${group.slug}`" class="font-heading text-xl font-semibold tracking-tight">{{ group.name }}</h2>
        <div class="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table class="w-full text-sm">
            <thead class="sr-only">
              <tr>
                <th scope="col">Paket</th>
                <th scope="col">Harga</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="item in group.packages" :key="item.id" class="transition-colors hover:bg-muted/40">
                <td class="px-5 py-4 sm:px-6">
                  <p class="font-medium">{{ item.name }}</p>
                  <p v-if="item.note" class="mt-1 text-xs text-muted-foreground">{{ item.note }}</p>
                </td>
                <td class="whitespace-nowrap px-5 py-4 text-right sm:px-6">
                  <p class="font-heading font-semibold">{{ formatIDR(item.price) }}</p>
                  <p v-if="item.unit" class="mt-0.5 text-xs text-muted-foreground">{{ item.unit }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <section class="mt-12 rounded-2xl border border-secondary-500/40 bg-secondary-50 p-6" aria-label="Ketentuan harga">
      <h2 class="font-heading text-base font-semibold text-secondary-900">Ketentuan harga</h2>
      <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-secondary-800">
        <li>Harga dapat berubah sesuai bidang, tingkat kesulitan, jumlah halaman, metode penelitian, kondisi data, dan deadline.</li>
        <li>Biaya publikasi/APC jurnal tidak termasuk, kecuali dinyatakan eksplisit dalam paket.</li>
        <li>Harga final selalu disepakati tertulis sebelum pengerjaan dimulai.</li>
      </ul>
      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <RouterLink
          to="/order"
          class="rounded-lg bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Pesan Sekarang
        </RouterLink>
        <a
          :href="consultLink"
          target="_blank"
          rel="noreferrer"
          class="rounded-lg border border-border bg-background px-6 py-3 text-center text-sm font-semibold transition-colors hover:border-primary/40"
        >
          Konsultasikan Kebutuhanmu
        </a>
      </div>
    </section>

    <div class="mt-12 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <EstimationCalculator />
    </div>
  </main>
</template>
