<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { PortfolioItem } from '../../contract';
import { PORTFOLIO_CATEGORIES } from '../../contract';
import { createPortfolioClient } from '../client';

const client = createPortfolioClient();

const items = ref<PortfolioItem[]>([]);
const editing = ref<PortfolioItem | null>(null);
const isCreating = ref(false);
const isLoading = ref(true);
const errorMessage = ref('');
const formMessage = ref('');
const formError = ref('');
const isSaving = ref(false);

const form = ref<{ category: string; title: string; summary: string; sortOrder: number }>({
  category: PORTFOLIO_CATEGORIES[0] ?? 'Skripsi',
  title: '',
  summary: '',
  sortOrder: 0,
});

function resetForm(): void {
  form.value = { category: PORTFOLIO_CATEGORIES[0] ?? 'Skripsi', title: '', summary: '', sortOrder: 0 };
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
    items.value = response.data.items;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat portofolio';
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

function startEdit(item: PortfolioItem): void {
  form.value = { category: item.category, title: item.title, summary: item.summary, sortOrder: 0 };
  editing.value = item;
  isCreating.value = false;
  formMessage.value = '';
  formError.value = '';
}

async function save(): Promise<void> {
  if (isSaving.value) return;
  isSaving.value = true;
  formMessage.value = '';
  formError.value = '';
  try {
    if (isCreating.value) {
      const response = await client.create({
        category: form.value.category as (typeof PORTFOLIO_CATEGORIES)[number],
        title: form.value.title,
        summary: form.value.summary,
        sortOrder: Number(form.value.sortOrder),
      });
      if (!response.success) {
        formError.value = response.message;
        return;
      }
      formMessage.value = 'Item berhasil dibuat.';
    } else if (editing.value) {
      const response = await client.update(editing.value.id, {
        category: form.value.category as (typeof PORTFOLIO_CATEGORIES)[number],
        title: form.value.title,
        summary: form.value.summary,
        sortOrder: Number(form.value.sortOrder),
      });
      if (!response.success) {
        formError.value = response.message;
        return;
      }
      formMessage.value = 'Item berhasil diperbarui.';
    }
    isCreating.value = false;
    editing.value = null;
    await load();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Gagal menyimpan item';
  } finally {
    isSaving.value = false;
  }
}

async function remove(item: PortfolioItem): Promise<void> {
  if (!window.confirm(`Hapus "${item.title}"?`)) return;
  const response = await client.remove(item.id);
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
      <h1 class="font-heading text-3xl font-semibold tracking-tight">Portofolio</h1>
      <button type="button" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" @click="startCreate">
        Tambah item
      </button>
    </div>

    <p v-if="isLoading" class="mt-6 text-sm text-muted-foreground">Memuat portofolio…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      {{ errorMessage }}
    </p>
    <div v-else class="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <table class="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr class="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th class="px-4 py-3">Judul</th>
            <th class="px-4 py-3">Kategori</th>
            <th class="px-4 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-b border-border last:border-0">
            <td class="px-4 py-3 font-medium">{{ item.title }}</td>
            <td class="px-4 py-3">{{ item.category }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button type="button" class="font-semibold text-primary hover:underline" @click="startEdit(item)">Ubah</button>
                <button type="button" class="font-semibold text-destructive hover:underline" @click="remove(item)">Hapus</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <section v-if="isCreating || editing" class="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft" aria-label="Form portofolio">
      <h2 class="font-heading text-base font-semibold">{{ isCreating ? 'Tambah item' : `Ubah: ${editing?.title}` }}</h2>
      <form class="mt-4 grid gap-3 text-sm sm:grid-cols-2" @submit.prevent="save">
        <label class="block">Judul
          <input v-model="form.title" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Kategori
          <select v-model="form.category" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2">
            <option v-for="category in PORTFOLIO_CATEGORIES" :key="category" :value="category">{{ category }}</option>
          </select>
        </label>
        <label class="block sm:col-span-2">Ringkasan
          <textarea v-model="form.summary" required rows="3" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Urutan
          <input v-model.number="form.sortOrder" type="number" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <p v-if="formMessage" role="status" class="sm:col-span-2 text-sm text-primary">{{ formMessage }}</p>
        <p v-if="formError" role="alert" class="sm:col-span-2 text-sm text-destructive">{{ formError }}</p>
        <div class="flex gap-2 sm:col-span-2">
          <button type="submit" :disabled="isSaving" class="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">
            {{ isSaving ? 'Menyimpan…' : 'Simpan' }}
          </button>
          <button type="button" class="rounded-lg border border-border px-4 py-2 font-semibold" @click="isCreating = false; editing = null;">
            Batal
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
