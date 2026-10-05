<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { ContentPage } from '../../contract';
import { parseBody } from '../blocks';
import { createContentClient } from '../client';
import { setPageHead } from '../../../../shared/web/head';

const props = defineProps<{ slug: string }>();
const client = createContentClient();

const page = ref<ContentPage | null>(null);
const isLoading = ref(true);
const errorMessage = ref('');
const blocks = computed(() => parseBody(page.value?.body ?? ''));

async function loadPage(slug: string): Promise<void> {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await client.page(slug);
    if (response.success) {
      page.value = response.data.page;
      setPageHead({
        title: `${response.data.page.title} — SobatPaper.id`,
        description: response.data.page.body.replace(/\s+/g, ' ').trim().slice(0, 160),
        path: `/${slug}`,
      });
    } else errorMessage.value = response.message;
  } catch {
    errorMessage.value = 'Halaman gagal dimuat. Coba muat ulang.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => loadPage(props.slug));
watch(() => props.slug, (slug) => loadPage(slug));
</script>

<template>
  <main class="min-h-[65vh] bg-[#f7f5f2] font-['Plus_Jakarta_Sans'] text-[#17191e] dark:bg-[#0d0f13] dark:text-[#f4f2ed]">
    <section class="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-24">
      <p v-if="isLoading" class="text-sm text-[#747a84] dark:text-[#9da3ad]">Memuat halaman…</p>
      <p v-else-if="errorMessage" role="alert" class="border-y border-[#dcd8d0] py-5 text-sm dark:border-white/10">
        {{ errorMessage }}
      </p>
      <article v-else-if="page" class="grid gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:gap-16">
        <div>
          <p class="text-xs font-extrabold text-[#ff704d]">Informasi</p>
          <h1 class="mt-4 max-w-[470px] text-[clamp(2.8rem,5.6vw,5rem)] font-semibold leading-[0.96] tracking-[-0.055em]">{{ page.title }}</h1>
        </div>

        <div class="max-w-[780px] border-t border-[#dcd8d0] pt-2 dark:border-white/10">
          <template v-for="(block, index) in blocks" :key="index">
            <h2 v-if="block.type === 'heading'" class="border-b border-[#dcd8d0] pb-4 pt-9 text-[clamp(1.5rem,2.5vw,2rem)] font-bold tracking-[-0.035em] first:pt-6 dark:border-white/10">
              {{ block.text }}
            </h2>
            <p v-else-if="block.type === 'paragraph'" class="pt-5 text-[15px] leading-8 text-[#5f6570] dark:text-[#adb2bb]">
              {{ block.text }}
            </p>
            <ul v-else class="space-y-3 pt-5 text-[15px] leading-7 text-[#5f6570] dark:text-[#adb2bb]">
              <li v-for="item in block.items" :key="item" class="grid grid-cols-[18px_1fr] gap-3">
                <span class="pt-0.5 text-[#ff704d]" aria-hidden="true">—</span>
                <span>{{ item }}</span>
              </li>
            </ul>
          </template>
        </div>
      </article>
    </section>
  </main>
</template>
