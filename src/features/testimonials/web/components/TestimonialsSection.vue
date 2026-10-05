<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Testimonial } from '../../contract';
import { createTestimonialsClient } from '../client';

const props = withDefaults(defineProps<{ limit?: number }>(), { limit: 4 });
const client = createTestimonialsClient();
const testimonials = ref<Testimonial[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const response = await client.list();
    if (response.success) testimonials.value = response.data.testimonials.slice(0, props.limit);
  } catch {
    testimonials.value = [];
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <section aria-labelledby="testimoni-title">
    <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-extrabold text-[#ff704d]">Cerita dari mereka</p>
        <h2 id="testimoni-title" class="mt-4 max-w-[650px] text-[clamp(2.6rem,5vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
          Bukan cuma selesai. <span class="testimonial-serif font-normal italic text-[#315bd6] dark:text-[#9eb6ff]">Lebih ngerti jalannya.</span>
        </h2>
      </div>
    </div>

    <p v-if="isLoading" class="mt-10 text-sm text-[#747a84] dark:text-[#9da3ad]">Memuat testimoni…</p>
    <div v-else-if="testimonials.length > 0" class="mt-10 grid gap-4 md:grid-cols-2">
      <figure
        v-for="(item, index) in testimonials"
        :key="item.id"
        class="rounded-[2rem] p-6 sm:p-7"
        :class="index % 4 === 0 ? 'bg-[#f1efff] dark:bg-[#191d32]' : index % 4 === 1 ? 'bg-[#ffe4dc] dark:bg-[#2b1d1a]' : index % 4 === 2 ? 'bg-[#fff3c9] dark:bg-[#2b2718]' : 'bg-white border border-[#e3dfd7] dark:bg-[#15181e] dark:border-white/10'"
      >
        <div class="mb-8 text-4xl leading-none text-[#315bd6] dark:text-[#9eb6ff]">“</div>
        <blockquote class="text-[18px] font-semibold leading-8 tracking-[-0.025em] sm:text-[20px]">{{ item.content }}</blockquote>
        <figcaption class="mt-7 text-xs font-bold text-[#6f7580] dark:text-[#9da3ad]">
          <span class="text-[#1d2026] dark:text-[#f1efe9]">{{ item.displayName }}</span>
          <span> · {{ item.role }}</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
section {
  font-family: 'Plus Jakarta Sans', 'DM Sans', sans-serif;
}

.testimonial-serif {
  font-family: 'Instrument Serif', Georgia, serif;
}
</style>
