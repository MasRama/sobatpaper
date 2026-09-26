<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PORTFOLIO_CATEGORIES, type PortfolioItem } from '../../contract';
import { createPortfolioClient } from '../client';
import { setPageHead } from '../../../../shared/web/head';

setPageHead({
  title: 'Portofolio — SobatPaper.id',
  description: 'Contoh hasil pendampingan skripsi, tesis, analisis data, artikel jurnal, dan formatting akademik.',
  path: '/portfolio',
});

const client = createPortfolioClient();
const items = ref<PortfolioItem[]>([]);
const activeCategory = ref<string>('');
const isLoading = ref(true);
const errorMessage = ref('');

async function loadItems(category: string): Promise<void> {
  activeCategory.value = category;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await client.list(category || undefined);
    if (response.success) items.value = response.data.items;
    else errorMessage.value = response.message;
  } catch {
    errorMessage.value = 'Portofolio gagal dimuat. Coba muat ulang halaman.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => loadItems(''));
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Portofolio</p>
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
      Contoh pekerjaan kami
    </h1>
    <p class="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
      Identitas customer disamarkan — dokumen dan data pribadi tidak pernah ditampilkan tanpa izin.
    </p>

    <div class="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
      <button
        type="button"
        class="rounded-full border px-4 py-2 text-sm transition-colors"
        :class="activeCategory === '' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'"
        @click="loadItems('')"
      >
        Semua
      </button>
      <button
        v-for="category in PORTFOLIO_CATEGORIES"
        :key="category"
        type="button"
        class="rounded-full border px-4 py-2 text-sm transition-colors"
        :class="activeCategory === category ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'"
        @click="loadItems(category)"
      >
        {{ category }}
      </button>
    </div>

    <p v-if="isLoading" class="mt-10 text-sm text-muted-foreground">Memuat portofolio…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-10 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
      {{ errorMessage }}
    </p>
    <p v-else-if="items.length === 0" class="mt-10 text-sm text-muted-foreground">
      Belum ada contoh pekerjaan di kategori ini.
    </p>
    <div v-else class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article v-for="item in items" :key="item.id" class="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <p class="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800">{{ item.category }}</p>
        <h2 class="mt-4 font-heading text-lg font-semibold tracking-tight">{{ item.title }}</h2>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">{{ item.summary }}</p>
      </article>
    </div>
  </main>
</template>
