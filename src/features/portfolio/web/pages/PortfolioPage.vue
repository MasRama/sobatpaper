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
  <main class="bg-[#f7f5f2] font-['Plus_Jakarta_Sans'] text-[#17191e] dark:bg-[#0d0f13] dark:text-[#f4f2ed]">
    <section class="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-24">
      <div class="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div>
          <p class="text-xs font-extrabold text-[#ff704d]">Portofolio</p>
          <p class="mt-4 max-w-[320px] text-sm leading-6 text-[#777d87] dark:text-[#9da3ad]">
            Identitas klien disamarkan. Dokumen dan data pribadi tidak ditampilkan tanpa izin.
          </p>
        </div>
        <h1 class="max-w-[820px] text-[clamp(3rem,6vw,5.4rem)] font-semibold leading-[0.96] tracking-[-0.06em]">
          Beberapa hal yang pernah <span class="font-['Instrument_Serif'] font-normal italic text-[#315bd6] dark:text-[#9eb6ff]">kami bantu rapikan.</span>
        </h1>
      </div>

      <div class="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-b border-[#dcd8d0] pb-4 dark:border-white/10" role="group" aria-label="Filter kategori">
      <button
        type="button"
        class="border-b-2 px-0 py-2 text-sm font-bold transition-colors"
        :class="activeCategory === '' ? 'border-[#315bd6] text-[#17191e] dark:text-white' : 'border-transparent text-[#858b94] hover:text-[#17191e] dark:text-[#8f959f] dark:hover:text-white'"
        @click="loadItems('')"
      >
        Semua
      </button>
      <button
        v-for="category in PORTFOLIO_CATEGORIES"
        :key="category"
        type="button"
        class="border-b-2 px-0 py-2 text-sm font-bold transition-colors"
        :class="activeCategory === category ? 'border-[#315bd6] text-[#17191e] dark:text-white' : 'border-transparent text-[#858b94] hover:text-[#17191e] dark:text-[#8f959f] dark:hover:text-white'"
        @click="loadItems(category)"
      >
        {{ category }}
      </button>
    </div>

      <p v-if="isLoading" class="mt-10 text-sm text-[#747a84] dark:text-[#9da3ad]">Memuat portofolio…</p>
      <p v-else-if="errorMessage" role="alert" class="mt-10 border-y border-[#dcd8d0] py-5 text-sm dark:border-white/10">
      {{ errorMessage }}
    </p>
      <p v-else-if="items.length === 0" class="mt-10 text-sm text-[#747a84] dark:text-[#9da3ad]">
      Belum ada contoh pekerjaan di kategori ini.
    </p>
      <div v-else class="mt-10 grid border-t border-l border-[#dcd8d0] dark:border-white/10 sm:grid-cols-2 lg:grid-cols-3">
      <article v-for="item in items" :key="item.id" class="min-h-[240px] border-r border-b border-[#dcd8d0] p-6 dark:border-white/10 sm:p-7">
        <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff704d]">{{ item.category }}</p>
        <h2 class="mt-8 text-[clamp(1.35rem,2vw,1.8rem)] font-bold leading-[1.15] tracking-[-0.035em]">{{ item.title }}</h2>
        <p class="mt-4 text-sm leading-6 text-[#707680] dark:text-[#9ca2ac]">{{ item.summary }}</p>
      </article>
    </div>
    </section>
  </main>
</template>
