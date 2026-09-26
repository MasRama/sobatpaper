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
  <main class="mx-auto max-w-3xl px-6 py-12 lg:py-16">
    <p v-if="isLoading" class="text-sm text-muted-foreground">Memuat halaman…</p>
    <p v-else-if="errorMessage" role="alert" class="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
      {{ errorMessage }}
    </p>
    <article v-else-if="page">
      <h1 class="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{{ page.title }}</h1>
      <div class="mt-8 space-y-5">
        <template v-for="(block, index) in blocks" :key="index">
          <h2 v-if="block.type === 'heading'" class="pt-4 font-heading text-xl font-semibold tracking-tight">
            {{ block.text }}
          </h2>
          <p v-else-if="block.type === 'paragraph'" class="text-base leading-relaxed text-muted-foreground">
            {{ block.text }}
          </p>
          <ul v-else class="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
            <li v-for="item in block.items" :key="item">{{ item }}</li>
          </ul>
        </template>
      </div>
    </article>
  </main>
</template>
