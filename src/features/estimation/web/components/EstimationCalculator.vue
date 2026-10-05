<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatIDR } from '../../../services/web';
import { useSiteSettings } from '../../../site-settings/web';
import {
  EDUCATION_LEVELS,
  ESTIMATION_METHODS,
  ESTIMATION_SERVICES,
  JOURNAL_TARGETS,
  type QuoteInput,
  type QuoteResult,
} from '../../contract';
import { createEstimationClient } from '../client';

const client = createEstimationClient();
const { linkFor, load: loadSettings } = useSiteSettings();

const SERVICE_LABELS: Record<string, string> = {
  skripsi: 'Pendampingan Skripsi',
  tesis: 'Pendampingan Tesis',
  'analisis-data': 'Analisis Data Penelitian',
  'editing-formatting': 'Editing & Formatting',
  'konversi-jurnal': 'Konversi Skripsi/Tesis → Artikel',
  'artikel-ilmiah': 'Artikel Ilmiah',
};

const METHOD_LABELS: Record<string, string> = {
  kuantitatif: 'Kuantitatif',
  kualitatif: 'Kualitatif',
  mixed: 'Mixed-method',
  rnd: 'R&D',
  'sem-pls': 'SEM/PLS',
  lainnya: 'Lainnya',
};

const form = ref({
  educationLevel: 'S1',
  serviceSlug: 'skripsi',
  field: '',
  method: 'kuantitatif',
  pages: 0,
  dataCount: 0,
  journalTarget: '',
  deadline: '',
});

const quote = ref<QuoteResult | null>(null);
const isLoading = ref(false);
const errorMessage = ref('');
const fieldErrors = ref<Record<string, string[]>>({});

const needsJournalTarget = computed(
  () => form.value.serviceSlug === 'konversi-jurnal' || form.value.serviceSlug === 'artikel-ilmiah',
);

const consultHref = computed(() => {
  if (!quote.value) return '#';
  const service = SERVICE_LABELS[form.value.serviceSlug] ?? form.value.serviceSlug;
  const method = METHOD_LABELS[form.value.method] ?? form.value.method;
  const deadline = form.value.deadline
    ? new Date(`${form.value.deadline}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';
  return linkFor(
    `Halo SobatPaper, saya ingin konsultasi layanan ${service}. Jenjang: ${form.value.educationLevel}. ` +
      `Bidang: ${form.value.field}. Metode: ${method}. Deadline: ${deadline}. ` +
      `Estimasi kalkulator: ${formatIDR(quote.value.min)} – ${formatIDR(quote.value.max)}. ` +
      'Mohon informasi estimasi biaya dan prosesnya.',
  );
});

async function calculate(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = '';
  fieldErrors.value = {};
  quote.value = null;
  try {
    await loadSettings();
    const input: QuoteInput = {
      educationLevel: form.value.educationLevel as QuoteInput['educationLevel'],
      serviceSlug: form.value.serviceSlug as QuoteInput['serviceSlug'],
      field: form.value.field,
      method: form.value.method as QuoteInput['method'],
      pages: Number(form.value.pages) || 0,
      dataCount: Number(form.value.dataCount) || 0,
      journalTarget: (form.value.journalTarget || null) as QuoteInput['journalTarget'],
      deadline: form.value.deadline,
    };
    const response = await client.quote(input);
    if (response.success) quote.value = response.data;
    else {
      errorMessage.value = response.message;
      fieldErrors.value = 'errors' in response && response.errors ? response.errors : {};
    }
  } catch {
    errorMessage.value = 'Estimasi gagal dihitung. Coba lagi.';
  } finally {
    isLoading.value = false;
  }
}

function fieldError(name: string): string {
  return fieldErrors.value[name]?.join(' ') ?? '';
}
</script>

<template>
  <section class="font-['Plus_Jakarta_Sans']" aria-labelledby="estimasi-title">
    <p class="text-xs font-extrabold text-[#ff704d]">Estimasi</p>
    <h2 id="estimasi-title" class="mt-3 text-[clamp(2rem,3.6vw,3.2rem)] font-bold tracking-[-0.045em]">Kalkulator estimasi</h2>
    <p class="mt-3 max-w-2xl text-sm leading-7 text-[#707680] dark:text-[#9ca2ac]">
      Isi kebutuhanmu untuk mendapat estimasi rentang harga. Ini bukan harga final —
      harga pasti disepakati setelah konsultasi dan analisis scope.
    </p>

    <form class="mt-8 grid gap-5 sm:grid-cols-2" @submit.prevent="calculate">
      <label class="block text-sm">
        <span class="text-xs font-bold text-[#555b65] dark:text-[#b1b6bf]">Jenjang pendidikan</span>
        <select v-model="form.educationLevel" class="mt-2 w-full rounded-[1rem] border border-[#d6d1c8] bg-white/55 px-4 py-3 outline-none transition focus:border-[#315bd6] dark:border-white/15 dark:bg-white/[0.035] dark:focus:border-[#9eb6ff]">
          <option v-for="level in EDUCATION_LEVELS" :key="level" :value="level">{{ level }}</option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="text-xs font-bold text-[#555b65] dark:text-[#b1b6bf]">Jenis layanan</span>
        <select v-model="form.serviceSlug" class="mt-2 w-full rounded-[1rem] border border-[#d6d1c8] bg-white/55 px-4 py-3 outline-none transition focus:border-[#315bd6] dark:border-white/15 dark:bg-white/[0.035] dark:focus:border-[#9eb6ff]">
          <option v-for="slug in ESTIMATION_SERVICES" :key="slug" :value="slug">{{ SERVICE_LABELS[slug] }}</option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="text-xs font-bold text-[#555b65] dark:text-[#b1b6bf]">Bidang / jurusan</span>
        <input v-model="form.field" type="text" placeholder="cth. Pendidikan, Manajemen" class="mt-2 w-full rounded-[1rem] border border-[#d6d1c8] bg-white/55 px-4 py-3 outline-none transition focus:border-[#315bd6] dark:border-white/15 dark:bg-white/[0.035] dark:focus:border-[#9eb6ff]" />
        <span v-if="fieldError('field')" class="mt-1 block text-xs text-destructive">{{ fieldError('field') }}</span>
      </label>
      <label class="block text-sm">
        <span class="text-xs font-bold text-[#555b65] dark:text-[#b1b6bf]">Metode penelitian</span>
        <select v-model="form.method" class="mt-2 w-full rounded-[1rem] border border-[#d6d1c8] bg-white/55 px-4 py-3 outline-none transition focus:border-[#315bd6] dark:border-white/15 dark:bg-white/[0.035] dark:focus:border-[#9eb6ff]">
          <option v-for="method in ESTIMATION_METHODS" :key="method" :value="method">{{ METHOD_LABELS[method] }}</option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="text-xs font-bold text-[#555b65] dark:text-[#b1b6bf]">Jumlah halaman (0 bila belum ada naskah)</span>
        <input v-model.number="form.pages" type="number" min="0" max="2000" class="mt-2 w-full rounded-[1rem] border border-[#d6d1c8] bg-white/55 px-4 py-3 outline-none transition focus:border-[#315bd6] dark:border-white/15 dark:bg-white/[0.035] dark:focus:border-[#9eb6ff]" />
        <span v-if="fieldError('pages')" class="mt-1 block text-xs text-destructive">{{ fieldError('pages') }}</span>
      </label>
      <label class="block text-sm">
        <span class="text-xs font-bold text-[#555b65] dark:text-[#b1b6bf]">Jumlah data/responden (analisis)</span>
        <input v-model.number="form.dataCount" type="number" min="0" max="1000000" class="mt-2 w-full rounded-[1rem] border border-[#d6d1c8] bg-white/55 px-4 py-3 outline-none transition focus:border-[#315bd6] dark:border-white/15 dark:bg-white/[0.035] dark:focus:border-[#9eb6ff]" />
      </label>
      <label v-if="needsJournalTarget" class="block text-sm">
        <span class="text-xs font-bold text-[#555b65] dark:text-[#b1b6bf]">Target jurnal</span>
        <select v-model="form.journalTarget" class="mt-2 w-full rounded-[1rem] border border-[#d6d1c8] bg-white/55 px-4 py-3 outline-none transition focus:border-[#315bd6] dark:border-white/15 dark:bg-white/[0.035] dark:focus:border-[#9eb6ff]">
          <option value="">Pilih target</option>
          <option v-for="target in JOURNAL_TARGETS" :key="target" :value="target">{{ target }}</option>
        </select>
        <span v-if="fieldError('journalTarget')" class="mt-1 block text-xs text-destructive">{{ fieldError('journalTarget') }}</span>
      </label>
      <label class="block text-sm">
        <span class="text-xs font-bold text-[#555b65] dark:text-[#b1b6bf]">Deadline</span>
        <input v-model="form.deadline" type="date" class="mt-2 w-full rounded-[1rem] border border-[#d6d1c8] bg-white/55 px-4 py-3 outline-none transition focus:border-[#315bd6] dark:border-white/15 dark:bg-white/[0.035] dark:focus:border-[#9eb6ff]" />
        <span v-if="fieldError('deadline')" class="mt-1 block text-xs text-destructive">{{ fieldError('deadline') }}</span>
      </label>
      <div class="sm:col-span-2">
        <button
          type="submit"
          :disabled="isLoading"
          class="rounded-[1rem] bg-[#17191e] px-6 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 dark:bg-[#f4f2ed] dark:text-[#17191e]"
        >
          {{ isLoading ? 'Menghitung…' : 'Hitung Estimasi' }}
        </button>
      </div>
    </form>

    <p v-if="errorMessage && !quote" role="alert" class="mt-6 border-y border-[#b9472f]/30 py-4 text-sm text-[#b9472f]">
      {{ errorMessage }}
    </p>

    <div v-if="quote" class="mt-8 border-y border-[#dcd8d0] py-6 dark:border-white/10" aria-live="polite">
      <p class="text-xs font-bold text-[#858b94] dark:text-[#8f959f]">Estimasi rentang harga</p>
      <p class="mt-2 text-[clamp(2rem,4vw,3.2rem)] font-bold tracking-[-0.045em]">
        {{ formatIDR(quote.min) }} – {{ formatIDR(quote.max) }}
      </p>
      <p class="mt-1 text-xs text-[#858b94] dark:text-[#8f959f]">Bukan harga final.</p>
      <ul class="mt-4 space-y-2 text-sm text-[#555b65] dark:text-[#b1b6bf]">
        <li v-for="factor in quote.factors" :key="factor">{{ factor }}</li>
      </ul>
      <a
        :href="consultHref"
        target="_blank"
        rel="noreferrer"
        class="mt-6 inline-block rounded-[1rem] bg-[#1f3167] px-6 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 dark:bg-[#9eb6ff] dark:text-[#18254f]"
      >
        Konsultasikan Pesanan
      </a>
    </div>
  </section>
</template>
