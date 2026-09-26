<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { ServiceDetail, ServiceSummary } from '../../contract';
import { createServicesClient } from '../client';

const client = createServicesClient();

const services = ref<ServiceSummary[]>([]);
const editing = ref<ServiceDetail | null>(null);
const isCreating = ref(false);
const isLoading = ref(true);
const errorMessage = ref('');
const formMessage = ref('');
const formError = ref('');
const isSaving = ref(false);

const form = ref({
  slug: '',
  name: '',
  tagline: '',
  description: '',
  scope: '',
  process: '',
  estimatedTime: '',
  startingPrice: 0,
  disclaimer: '',
  sortOrder: 0,
  faqs: [] as Array<{ question: string; answer: string }>,
});

function resetForm(): void {
  form.value = {
    slug: '',
    name: '',
    tagline: '',
    description: '',
    scope: '',
    process: '',
    estimatedTime: '',
    startingPrice: 0,
    disclaimer: '',
    sortOrder: 0,
    faqs: [],
  };
}

async function load(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await client.list();
    if (!response.success) {
      errorMessage.value = response.message;
      return;
    }
    services.value = response.data.services;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat layanan';
  } finally {
    isLoading.value = false;
  }
}

function startCreate(): void {
  resetForm();
  editing.value = null;
  isCreating.value = true;
  formMessage.value = '';
  formError.value = '';
}

async function startEdit(service: ServiceSummary): Promise<void> {
  formMessage.value = '';
  formError.value = '';
  const response = await client.detail(service.slug);
  if (!response.success) {
    formError.value = response.message;
    return;
  }
  editing.value = response.data.service;
  isCreating.value = false;
  form.value = {
    slug: response.data.service.slug,
    name: response.data.service.name,
    tagline: response.data.service.tagline,
    description: response.data.service.description,
    scope: response.data.service.scope.join('\n'),
    process: response.data.service.process.join('\n'),
    estimatedTime: response.data.service.estimatedTime,
    startingPrice: response.data.service.startingPrice,
    disclaimer: response.data.service.disclaimer ?? '',
    sortOrder: 0,
    faqs: response.data.service.faqs.map((faq) => ({ ...faq })),
  };
}

function addFaq(): void {
  form.value.faqs.push({ question: '', answer: '' });
}

function removeFaq(index: number): void {
  form.value.faqs.splice(index, 1);
}

async function save(): Promise<void> {
  if (isSaving.value) return;
  isSaving.value = true;
  formMessage.value = '';
  formError.value = '';
  try {
    const lines = (value: string): string[] =>
      value
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const faqs = form.value.faqs.filter((faq) => faq.question.trim() && faq.answer.trim());
    if (isCreating.value) {
      const response = await client.create({
        slug: form.value.slug.trim().toLowerCase(),
        name: form.value.name,
        tagline: form.value.tagline,
        description: form.value.description,
        scope: lines(form.value.scope),
        process: lines(form.value.process),
        estimatedTime: form.value.estimatedTime,
        startingPrice: Number(form.value.startingPrice),
        disclaimer: form.value.disclaimer.trim() || null,
        sortOrder: Number(form.value.sortOrder),
        faqs,
      });
      if (!response.success) {
        formError.value = response.message;
        return;
      }
      formMessage.value = 'Layanan berhasil dibuat.';
    } else if (editing.value) {
      const response = await client.update(editing.value.id, {
        name: form.value.name,
        tagline: form.value.tagline,
        description: form.value.description,
        scope: lines(form.value.scope),
        process: lines(form.value.process),
        estimatedTime: form.value.estimatedTime,
        startingPrice: Number(form.value.startingPrice),
        disclaimer: form.value.disclaimer.trim() || null,
        sortOrder: Number(form.value.sortOrder),
        faqs,
      });
      if (!response.success) {
        formError.value = response.message;
        return;
      }
      formMessage.value = 'Layanan berhasil diperbarui.';
    }
    isCreating.value = false;
    editing.value = null;
    await load();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Gagal menyimpan layanan';
  } finally {
    isSaving.value = false;
  }
}

async function remove(service: ServiceSummary): Promise<void> {
  if (!window.confirm(`Hapus layanan "${service.name}"?`)) return;
  const response = await client.remove(service.id);
  if (!response.success) {
    errorMessage.value = response.message;
    return;
  }
  await load();
}

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10 lg:px-8">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Admin</p>
    <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-heading text-3xl font-semibold tracking-tight">Layanan</h1>
      <button type="button" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" @click="startCreate">
        Tambah layanan
      </button>
    </div>

    <p v-if="isLoading" class="mt-6 text-sm text-muted-foreground">Memuat layanan…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      {{ errorMessage }}
    </p>
    <div v-else class="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <table class="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr class="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th class="px-4 py-3">Nama</th>
            <th class="px-4 py-3">Slug</th>
            <th class="px-4 py-3">Harga mulai</th>
            <th class="px-4 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in services" :key="service.id" class="border-b border-border last:border-0">
            <td class="px-4 py-3 font-medium">{{ service.name }}</td>
            <td class="px-4 py-3">{{ service.slug }}</td>
            <td class="px-4 py-3">{{ service.startingPrice }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button type="button" class="font-semibold text-primary hover:underline" @click="startEdit(service)">Ubah</button>
                <button type="button" class="font-semibold text-destructive hover:underline" @click="remove(service)">Hapus</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <section v-if="isCreating || editing" class="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft" aria-label="Form layanan">
      <h2 class="font-heading text-base font-semibold">{{ isCreating ? 'Tambah layanan' : `Ubah: ${editing?.name}` }}</h2>
      <form class="mt-4 grid gap-3 text-sm sm:grid-cols-2" @submit.prevent="save">
        <label v-if="isCreating" class="block">Slug
          <input v-model="form.slug" required placeholder="contoh-layanan" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Nama
          <input v-model="form.name" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Tagline
          <input v-model="form.tagline" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block sm:col-span-2">Deskripsi
          <textarea v-model="form.description" required rows="3" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Scope (satu baris satu item)
          <textarea v-model="form.scope" rows="4" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Proses (satu baris satu langkah)
          <textarea v-model="form.process" rows="4" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Estimasi waktu
          <input v-model="form.estimatedTime" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Harga mulai (Rp)
          <input v-model.number="form.startingPrice" type="number" min="0" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Disclaimer (opsional)
          <input v-model="form.disclaimer" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Urutan
          <input v-model.number="form.sortOrder" type="number" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <div class="sm:col-span-2">
          <div class="flex items-center justify-between">
            <h3 class="font-heading text-sm font-semibold">FAQ layanan</h3>
            <button type="button" class="text-sm font-semibold text-primary hover:underline" @click="addFaq">+ Tambah FAQ</button>
          </div>
          <div v-for="(faq, index) in form.faqs" :key="index" class="mt-2 grid gap-2 rounded-lg border border-border p-3">
            <input v-model="faq.question" placeholder="Pertanyaan" class="w-full rounded-lg border border-border bg-background px-3 py-2" />
            <textarea v-model="faq.answer" rows="2" placeholder="Jawaban" class="w-full rounded-lg border border-border bg-background px-3 py-2" />
            <button type="button" class="justify-self-end text-sm font-semibold text-destructive hover:underline" @click="removeFaq(index)">
              Hapus FAQ
            </button>
          </div>
        </div>
        <p v-if="formMessage" role="status" class="sm:col-span-2 text-sm text-primary">{{ formMessage }}</p>
        <p v-if="formError" role="alert" class="sm:col-span-2 text-sm text-destructive">{{ formError }}</p>
        <div class="flex gap-2 sm:col-span-2">
          <button type="submit" :disabled="isSaving" class="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">
            {{ isSaving ? 'Menyimpan…' : 'Simpan' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-border px-4 py-2 font-semibold"
            @click="isCreating = false; editing = null;"
          >
            Batal
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
