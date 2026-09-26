<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import type { ServiceSummary } from '../../contract';
import { createServicesClient } from '../client';
import { formatIDR } from '../format';

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
  <main class="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Layanan Akademik</p>
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
      Pendampingan untuk setiap tahap riset
    </h1>
    <p class="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
      Pilih layanan sesuai kebutuhanmu — setiap layanan punya cakupan, proses,
      estimasi waktu, dan harga mulai yang transparan.
    </p>

    <p v-if="isLoading" class="mt-10 text-sm text-muted-foreground">Memuat layanan…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-10 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
      {{ errorMessage }}
    </p>
    <div v-else class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="service in services"
        :key="service.slug"
        :to="`/layanan/${service.slug}`"
        class="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-colors hover:border-primary/40"
      >
        <h2 class="font-heading text-lg font-semibold tracking-tight group-hover:text-primary">{{ service.name }}</h2>
        <p class="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{{ service.tagline }}</p>
        <p class="mt-4 text-sm">
          <span class="text-muted-foreground">Mulai </span>
          <span class="font-semibold">{{ formatIDR(service.startingPrice) }}</span>
        </p>
        <p class="mt-1 text-xs text-muted-foreground">{{ service.estimatedTime }}</p>
      </RouterLink>
    </div>
  </main>
</template>
