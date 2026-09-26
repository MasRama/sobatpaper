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
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Testimoni</p>
    <h2 id="testimoni-title" class="mt-3 font-heading text-3xl font-semibold tracking-tight">
      Kata mereka yang terbantu
    </h2>
    <p v-if="isLoading" class="mt-8 text-sm text-muted-foreground">Memuat testimoni…</p>
    <div v-else-if="testimonials.length > 0" class="mt-8 grid gap-4 sm:grid-cols-2">
      <figure v-for="item in testimonials" :key="item.id" class="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <blockquote class="text-sm leading-relaxed sm:text-base">“{{ item.content }}”</blockquote>
        <figcaption class="mt-4 text-sm">
          <span class="font-semibold">{{ item.displayName }}</span>
          <span class="text-muted-foreground"> — {{ item.role }}</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>
