<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import type { Testimonial } from '../../contract';
import { createTestimonialsClient } from '../client';

const props = withDefaults(defineProps<{ limit?: number }>(), { limit: 3 });
const client = createTestimonialsClient();
const testimonials = ref<Testimonial[]>([]);
const isLoading = ref(true);
const track = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: 'fallback-1',
    displayName: 'A***',
    role: 'Mahasiswa S2',
    content: 'Awalnya saya cuma punya data dan banyak catatan yang belum nyambung. Setelah dipetakan, saya jadi tahu bagian mana yang harus dikerjakan dulu dan kenapa.',
  },
  {
    id: 'fallback-2',
    displayName: 'R***',
    role: 'Mahasiswa tingkat akhir',
    content: 'Yang paling membantu bukan sekadar revisinya, tapi penjelasan alurnya. Jadi waktu ketemu dosen pembimbing saya lebih siap menjelaskan keputusan yang saya ambil.',
  },
  {
    id: 'fallback-3',
    displayName: 'D***',
    role: 'Peneliti',
    content: 'Diskusinya enak karena dari awal scope dan batas bantuannya jelas. Analisis yang tadinya terasa berantakan akhirnya punya arah yang bisa saya lanjutkan sendiri.',
  },
  {
    id: 'fallback-4',
    displayName: 'N***',
    role: 'Mahasiswa S1',
    content: 'Saya datang dalam kondisi draft belum rapi. Setelah beberapa tahap review, strukturnya jauh lebih masuk akal dan saya lebih paham isi tulisan saya sendiri.',
  },
];

const visibleTestimonials = computed(() => {
  const source = testimonials.value.length > 0 ? testimonials.value : FALLBACK_TESTIMONIALS;
  return source.slice(0, Math.min(props.limit, 3));
});

function syncScrollState(): void {
  const element = track.value;
  if (!element) return;
  canScrollLeft.value = element.scrollLeft > 2;
  canScrollRight.value = element.scrollLeft + element.clientWidth < element.scrollWidth - 2;
}

function scrollTestimonials(direction: -1 | 1): void {
  const element = track.value;
  if (!element) return;
  element.scrollBy({ left: direction * Math.max(element.clientWidth * 0.72, 320), behavior: 'smooth' });
}

onMounted(async () => {
  try {
    const response = await client.list();
    if (response.success) testimonials.value = response.data.testimonials.slice(0, props.limit);
  } catch {
    testimonials.value = [];
  } finally {
    isLoading.value = false;
    await nextTick();
    syncScrollState();
  }
});
</script>

<template>
  <section aria-labelledby="testimoni-title">
    <div class="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
      <div class="max-w-[700px]">
        <p class="text-xs font-extrabold text-[#ff704d]">Testimoni</p>
        <h2 id="testimoni-title" class="mt-4 text-[clamp(2.35rem,4.3vw,4rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
          Cerita setelah <span class="testimonial-serif font-normal italic text-[#315bd6] dark:text-[#9eb6ff]">dibantu prosesnya.</span>
        </h2>
        <p class="mt-4 max-w-[560px] text-sm leading-6 text-[#777d87] dark:text-[#9da3ad]">
          Pengalaman klien selama pendampingan. Tidak ada janji kelulusan, nilai, atau publikasi.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2" aria-label="Navigasi testimonial">
        <button
          type="button"
          class="group grid h-10 w-10 place-items-center text-xl text-[#5f646d] transition disabled:cursor-default disabled:opacity-25 dark:text-[#a8adb6]"
          :disabled="!canScrollLeft"
          aria-label="Testimonial sebelumnya"
          @click="scrollTestimonials(-1)"
        >
          <span class="transition-transform group-enabled:group-hover:-translate-x-1">←</span>
        </button>
        <button
          type="button"
          class="group grid h-10 w-10 place-items-center text-xl text-[#5f646d] transition disabled:cursor-default disabled:opacity-25 dark:text-[#a8adb6]"
          :disabled="!canScrollRight"
          aria-label="Testimonial berikutnya"
          @click="scrollTestimonials(1)"
        >
          <span class="transition-transform group-enabled:group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>

    <p v-if="isLoading" class="mt-10 text-sm text-[#747a84] dark:text-[#9da3ad]">Memuat testimoni…</p>
    <div
      v-else
      ref="track"
      class="testimonial-track mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
      @scroll.passive="syncScrollState"
    >
      <figure
        v-for="item in visibleTestimonials"
        :key="item.id"
        class="min-w-[88%] snap-start border-y border-[#dcd8d0] px-1 py-8 dark:border-white/10 sm:min-w-[72%] sm:px-3 sm:py-9 lg:min-w-[calc(50%-0.625rem)] lg:px-5"
      >
        <div class="testimonial-serif text-[42px] leading-none text-[#315bd6] dark:text-[#9eb6ff]" aria-hidden="true">“</div>
        <blockquote
          class="mt-1 max-w-[560px] text-[clamp(1.15rem,1.8vw,1.45rem)] font-semibold leading-[1.55] tracking-[-0.025em] text-[#26292f] dark:text-[#ece9e3]"
        >
          {{ item.content }}
        </blockquote>
        <figcaption class="mt-6 text-sm leading-6">
          <span class="font-bold text-[#1d2026] dark:text-[#f1efe9]">{{ item.displayName }}</span>
          <span class="text-[#a29c92] dark:text-[#6f7580]"> · </span>
          <span class="text-[#777d87] dark:text-[#9da3ad]">{{ item.role }}</span>
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

.testimonial-track {
  scrollbar-width: none;
}

.testimonial-track::-webkit-scrollbar {
  display: none;
}
</style>
