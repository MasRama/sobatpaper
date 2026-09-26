<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { createAttachmentsClient, type Attachment } from '../../../attachments/web';
import { createEstimationClient, type QuoteInput } from '../../../estimation/web';
import { formatIDR } from '../../../services/web';
import { useSiteSettings } from '../../../site-settings/web';
import {
  DOCUMENT_CONDITION_LABELS,
  DOCUMENT_CONDITIONS,
  ORDER_SERVICES,
  type CreateOrderInput,
  type Order,
} from '../../contract';
import { createOrdersClient } from '../client';
import { createAnalyticsClient } from '../../../analytics/web';
import { setPageHead } from '../../../../shared/web/head';

setPageHead({
  title: 'Pesan Layanan — SobatPaper.id',
  description: 'Isi kebutuhan penelitianmu, unggah dokumen, terima estimasi biaya, lalu konsultasi via WhatsApp.',
  path: '/order',
});

const ordersClient = createOrdersClient();
const analytics = createAnalyticsClient();
const attachmentsClient = createAttachmentsClient();
const estimationClient = createEstimationClient();
const route = useRoute();
const { linkFor, load: loadSettings } = useSiteSettings();

const SERVICE_LABELS: Record<string, string> = {
  skripsi: 'Pendampingan Skripsi',
  tesis: 'Pendampingan Tesis',
  'analisis-data': 'Analisis Data Penelitian',
  'editing-formatting': 'Editing & Formatting',
  'konversi-jurnal': 'Konversi Skripsi/Tesis → Artikel',
  'artikel-ilmiah': 'Artikel Ilmiah',
};

const today = new Date().toISOString().slice(0, 10);

const form = ref({
  serviceSlug: 'skripsi',
  educationLevel: 'S1',
  field: '',
  institution: '',
  topic: '',
  method: '',
  pages: 0,
  documentCondition: 'lengkap',
  deadline: '',
  specialNeeds: '',
  contactName: '',
  contactWhatsapp: '',
  dataCount: 0,
  journalTarget: '',
});

const step = ref<'form' | 'review' | 'done'>('form');
const attachments = ref<Attachment[]>([]);
const isUploading = ref(false);
const uploadError = ref('');
const isSubmitting = ref(false);
const submitError = ref('');
const fieldErrors = ref<Record<string, string[]>>({});
const estimate = ref<{ min: number; max: number } | null>(null);
const createdOrder = ref<Order | null>(null);

const needsJournalTarget = computed(
  () => form.value.serviceSlug === 'konversi-jurnal' || form.value.serviceSlug === 'artikel-ilmiah',
);

const consultHref = computed(() => {
  if (!createdOrder.value) return '#';
  const service = SERVICE_LABELS[form.value.serviceSlug] ?? form.value.serviceSlug;
  return linkFor(
    `Halo SobatPaper, saya baru saja mengirim pesanan ${createdOrder.value.number} untuk layanan ${service}. ` +
      'Mohon info langkah selanjutnya. Terima kasih.',
  );
});

onMounted(async () => {
  await loadSettings();
  const preselected = route.query.service;
  if (typeof preselected === 'string' && (ORDER_SERVICES as readonly string[]).includes(preselected)) {
    form.value.serviceSlug = preselected;
  }
  analytics.track('start_order', typeof preselected === 'string' ? { service: preselected } : {});
});

async function onFilesSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = input.files ? [...input.files] : [];
  input.value = '';
  if (files.length === 0) return;
  isUploading.value = true;
  uploadError.value = '';
  try {
    for (const file of files) {
      const response = await attachmentsClient.upload(file);
      if (response.success) {
        attachments.value.push(response.data.attachment);
        analytics.track('upload_document', {});
      }
      else uploadError.value = `${file.name}: ${response.message}`;
    }
  } catch {
    uploadError.value = 'Unggah gagal. Coba lagi.';
  } finally {
    isUploading.value = false;
  }
}

function removeAttachment(index: number): void {
  attachments.value.splice(index, 1);
}

function mapMethod(text: string): QuoteInput['method'] {
  const normalized = text.toLowerCase();
  if (normalized.includes('kualitatif')) return 'kualitatif';
  if (normalized.includes('mix')) return 'mixed';
  if (normalized.includes('sem') || normalized.includes('pls')) return 'sem-pls';
  if (normalized.includes('rnd') || normalized.includes('r&d')) return 'rnd';
  return 'kuantitatif';
}

async function goReview(): Promise<void> {
  estimate.value = null;
  try {
    const response = await estimationClient.quote({
      educationLevel: form.value.educationLevel as QuoteInput['educationLevel'],
      serviceSlug: form.value.serviceSlug as QuoteInput['serviceSlug'],
      field: form.value.field || '-',
      method: mapMethod(form.value.method),
      pages: Number(form.value.pages) || 0,
      dataCount: Number(form.value.dataCount) || 0,
      journalTarget: (form.value.journalTarget || null) as QuoteInput['journalTarget'],
      deadline: form.value.deadline || '2030-12-31',
    });
    if (response.success) estimate.value = { min: response.data.min, max: response.data.max };
  } catch {
    estimate.value = null;
  }
  step.value = 'review';
}

async function submit(): Promise<void> {
  isSubmitting.value = true;
  submitError.value = '';
  fieldErrors.value = {};
  try {
    const input: CreateOrderInput = {
      serviceSlug: form.value.serviceSlug as CreateOrderInput['serviceSlug'],
      educationLevel: form.value.educationLevel as CreateOrderInput['educationLevel'],
      field: form.value.field,
      institution: form.value.institution,
      topic: form.value.topic,
      method: form.value.method,
      pages: Number(form.value.pages) || 0,
      documentCondition: form.value.documentCondition as CreateOrderInput['documentCondition'],
      deadline: form.value.deadline,
      specialNeeds: form.value.specialNeeds || null,
      contactName: form.value.contactName,
      contactWhatsapp: form.value.contactWhatsapp,
      attachmentIds: attachments.value.map((attachment) => attachment.id),
      estimateMin: estimate.value?.min ?? null,
      estimateMax: estimate.value?.max ?? null,
    };
    const response = await ordersClient.create(input);
    if (response.success) {
      createdOrder.value = response.data.order;
      analytics.track('submit_order', { order_id: response.data.order.number, service: response.data.order.serviceSlug });
      step.value = 'done';
    } else {
      submitError.value = response.message;
      fieldErrors.value = 'errors' in response && response.errors ? response.errors : {};
      step.value = 'form';
    }
  } catch {
    submitError.value = 'Pesanan gagal dikirim. Coba lagi.';
    step.value = 'form';
  } finally {
    isSubmitting.value = false;
  }
}

function fieldError(name: string): string {
  return fieldErrors.value[name]?.join(' ') ?? '';
}

function reviewRows(): Array<[string, string]> {
  return [
    ['Layanan', SERVICE_LABELS[form.value.serviceSlug] ?? form.value.serviceSlug],
    ['Jenjang', form.value.educationLevel],
    ['Bidang', form.value.field],
    ['Institusi', form.value.institution],
    ['Topik', form.value.topic],
    ['Metode', form.value.method],
    ['Jumlah halaman', String(form.value.pages)],
    [
      'Kondisi dokumen',
      DOCUMENT_CONDITION_LABELS[form.value.documentCondition as keyof typeof DOCUMENT_CONDITION_LABELS] ??
        form.value.documentCondition,
    ],
    ['Deadline', form.value.deadline],
    ['Nama', form.value.contactName],
    ['WhatsApp', form.value.contactWhatsapp],
    ['Dokumen', attachments.value.length > 0 ? attachments.value.map((file) => file.name).join(', ') : 'Tidak ada'],
  ];
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-6 py-12 lg:py-16">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Pemesanan</p>
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
      {{ step === 'done' ? 'Pesanan terkirim' : step === 'review' ? 'Periksa pesananmu' : 'Formulir pemesanan' }}
    </h1>

    <div v-if="step === 'form'" class="mt-8 space-y-4">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Isi kebutuhan risetmu selengkap mungkin. Setelah dikirim, tim kami akan
        menghubungimu untuk analisis scope dan penawaran harga final.
      </p>
      <p v-if="submitError" role="alert" class="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        {{ submitError }}
      </p>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="font-medium">Layanan</span>
          <select v-model="form.serviceSlug" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2">
            <option v-for="slug in ORDER_SERVICES" :key="slug" :value="slug">{{ SERVICE_LABELS[slug] }}</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="font-medium">Jenjang pendidikan</span>
          <select v-model="form.educationLevel" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2">
            <option>S1</option>
            <option>S2</option>
            <option>S3</option>
            <option>lainnya</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="font-medium">Bidang / jurusan</span>
          <input v-model="form.field" type="text" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          <span v-if="fieldError('field')" class="mt-1 block text-xs text-destructive">{{ fieldError('field') }}</span>
        </label>
        <label class="block text-sm">
          <span class="font-medium">Institusi</span>
          <input v-model="form.institution" type="text" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          <span v-if="fieldError('institution')" class="mt-1 block text-xs text-destructive">{{ fieldError('institution') }}</span>
        </label>
      </div>

      <label class="block text-sm">
        <span class="font-medium">Topik penelitian</span>
        <input v-model="form.topic" type="text" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        <span v-if="fieldError('topic')" class="mt-1 block text-xs text-destructive">{{ fieldError('topic') }}</span>
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="font-medium">Metode penelitian</span>
          <input v-model="form.method" type="text" placeholder="cth. Kuantitatif regresi" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          <span v-if="fieldError('method')" class="mt-1 block text-xs text-destructive">{{ fieldError('method') }}</span>
        </label>
        <label class="block text-sm">
          <span class="font-medium">Jumlah halaman</span>
          <input v-model.number="form.pages" type="number" min="0" max="2000" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block text-sm">
          <span class="font-medium">Kondisi dokumen</span>
          <select v-model="form.documentCondition" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2">
            <option v-for="condition in DOCUMENT_CONDITIONS" :key="condition" :value="condition">
              {{ DOCUMENT_CONDITION_LABELS[condition] }}
            </option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="font-medium">Deadline</span>
          <input v-model="form.deadline" type="date" :min="today" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          <span v-if="fieldError('deadline')" class="mt-1 block text-xs text-destructive">{{ fieldError('deadline') }}</span>
        </label>
        <label v-if="needsJournalTarget" class="block text-sm">
          <span class="font-medium">Target jurnal</span>
          <select v-model="form.journalTarget" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2">
            <option value="">Pilih target</option>
            <option>SINTA 6</option>
            <option>SINTA 5</option>
            <option>SINTA 4</option>
            <option>SINTA 3</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="font-medium">Jumlah data/responden (bila ada)</span>
          <input v-model.number="form.dataCount" type="number" min="0" max="1000000" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
      </div>

      <label class="block text-sm">
        <span class="font-medium">Kebutuhan khusus (opsional)</span>
        <textarea v-model="form.specialNeeds" rows="3" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"></textarea>
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="font-medium">Nama</span>
          <input v-model="form.contactName" type="text" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          <span v-if="fieldError('contactName')" class="mt-1 block text-xs text-destructive">{{ fieldError('contactName') }}</span>
        </label>
        <label class="block text-sm">
          <span class="font-medium">WhatsApp (cth. 62812…)</span>
          <input v-model="form.contactWhatsapp" type="tel" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          <span v-if="fieldError('contactWhatsapp')" class="mt-1 block text-xs text-destructive">{{ fieldError('contactWhatsapp') }}</span>
        </label>
      </div>

      <div class="rounded-2xl border border-border bg-card p-5">
        <label class="block text-sm">
          <span class="font-medium">Dokumen pendukung (PDF, DOC, DOCX, XLSX, CSV, PPTX, ZIP — maks 10 MB/file)</span>
          <input type="file" multiple accept=".pdf,.doc,.docx,.xlsx,.csv,.pptx,.zip" :disabled="isUploading" class="mt-2 w-full text-sm" @change="onFilesSelected" />
        </label>
        <p v-if="isUploading" class="mt-2 text-sm text-muted-foreground">Mengunggah…</p>
        <p v-if="uploadError" role="alert" class="mt-2 text-sm text-destructive">{{ uploadError }}</p>
        <ul v-if="attachments.length > 0" class="mt-3 space-y-2">
          <li v-for="(file, index) in attachments" :key="file.id" class="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span class="truncate">{{ file.name }}</span>
            <button type="button" class="shrink-0 text-destructive hover:underline" @click="removeAttachment(index)">
              Hapus
            </button>
          </li>
        </ul>
      </div>

      <button
        type="button"
        class="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
        @click="goReview"
      >
        Lanjut ke Pemeriksaan
      </button>
    </div>

    <div v-else-if="step === 'review'" class="mt-8">
      <dl class="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        <div v-for="[label, value] in reviewRows()" :key="label" class="grid gap-1 px-5 py-3 sm:grid-cols-3 sm:gap-4">
          <dt class="text-sm text-muted-foreground">{{ label }}</dt>
          <dd class="text-sm font-medium sm:col-span-2">{{ value }}</dd>
        </div>
        <div v-if="estimate" class="grid gap-1 bg-primary-50 px-5 py-3 sm:grid-cols-3 sm:gap-4">
          <dt class="text-sm text-primary-800">Estimasi biaya</dt>
          <dd class="text-sm font-semibold text-primary-900 sm:col-span-2">
            {{ formatIDR(estimate.min) }} – {{ formatIDR(estimate.max) }} (bukan harga final)
          </dd>
        </div>
      </dl>
      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          :disabled="isSubmitting"
          class="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          @click="submit"
        >
          {{ isSubmitting ? 'Mengirim…' : 'Kirim Pesanan' }}
        </button>
        <button
          type="button"
          :disabled="isSubmitting"
          class="rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-colors hover:border-primary/40 disabled:opacity-60"
          @click="step = 'form'"
        >
          Kembali
        </button>
      </div>
    </div>

    <div v-else-if="step === 'done' && createdOrder" class="mt-8 text-center">
      <p class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-2xl text-primary-800" aria-hidden="true">✓</p>
      <h2 class="mt-5 font-heading text-2xl font-semibold tracking-tight">Pesanan {{ createdOrder.number }} terkirim</h2>
      <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        Tim kami akan menghubungimu via WhatsApp untuk analisis scope dan penawaran
        harga final. Simpan nomor pesananmu untuk pelacakan.
      </p>
      <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          :href="consultHref"
          target="_blank"
          rel="noreferrer"
          class="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Konsultasi via WhatsApp
        </a>
        <RouterLink
          to="/"
          class="rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-colors hover:border-primary/40"
        >
          Kembali ke Beranda
        </RouterLink>
      </div>
    </div>
  </main>
</template>
