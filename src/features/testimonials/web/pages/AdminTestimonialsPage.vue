<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Testimonial } from '../../contract';
import { createTestimonialsClient } from '../client';

const client = createTestimonialsClient();

const items = ref<Testimonial[]>([]);
const editing = ref<Testimonial | null>(null);
const isCreating = ref(false);
const isLoading = ref(true);
const errorMessage = ref('');
const formMessage = ref('');
const formError = ref('');
const isSaving = ref(false);

const form = ref({ displayName: '', role: '', content: '', sortOrder: 0 });

function resetForm(): void {
  form.value = { displayName: '', role: '', content: '', sortOrder: 0 };
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
    items.value = response.data.testimonials;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat testimonial';
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

function startEdit(item: Testimonial): void {
  form.value = { displayName: item.displayName, role: item.role, content: item.content, sortOrder: 0 };
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
        displayName: form.value.displayName,
        role: form.value.role,
        content: form.value.content,
        sortOrder: Number(form.value.sortOrder),
      });
      if (!response.success) {
        formError.value = response.message;
        return;
      }
      formMessage.value = 'Testimonial berhasil dibuat.';
    } else if (editing.value) {
      const response = await client.update(editing.value.id, {
        displayName: form.value.displayName,
        role: form.value.role,
        content: form.value.content,
        sortOrder: Number(form.value.sortOrder),
      });
      if (!response.success) {
        formError.value = response.message;
        return;
      }
      formMessage.value = 'Testimonial berhasil diperbarui.';
    }
    isCreating.value = false;
    editing.value = null;
    await load();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Gagal menyimpan testimonial';
  } finally {
    isSaving.value = false;
  }
}

async function remove(item: Testimonial): Promise<void> {
  if (!window.confirm(`Hapus testimonial dari "${item.displayName}"?`)) return;
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
      <h1 class="font-heading text-3xl font-semibold tracking-tight">Testimonial</h1>
      <button type="button" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" @click="startCreate">
        Tambah testimonial
      </button>
    </div>

    <p v-if="isLoading" class="mt-6 text-sm text-muted-foreground">Memuat testimonial…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      {{ errorMessage }}
    </p>
    <div v-else-if="items.length === 0" class="mt-6 border-y border-border py-6">
      <p class="font-heading text-lg font-semibold">Belum ada testimonial asli.</p>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Landing page sementara menampilkan contoh testimonial. Begitu testimonial pertama ditambahkan di sini, contoh tersebut otomatis tidak ditampilkan lagi.
      </p>
      <button type="button" class="mt-4 font-semibold text-primary hover:underline" @click="startCreate">
        Tambah testimonial pertama
      </button>
    </div>
    <div v-else class="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <table class="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr class="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th class="px-4 py-3">Nama tampil</th>
            <th class="px-4 py-3">Peran</th>
            <th class="px-4 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-b border-border last:border-0">
            <td class="px-4 py-3 font-medium">{{ item.displayName }}</td>
            <td class="px-4 py-3">{{ item.role }}</td>
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

    <section v-if="isCreating || editing" class="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft" aria-label="Form testimonial">
      <h2 class="font-heading text-base font-semibold">{{ isCreating ? 'Tambah testimonial' : `Ubah: ${editing?.displayName}` }}</h2>
      <form class="mt-4 grid gap-3 text-sm sm:grid-cols-2" @submit.prevent="save">
        <label class="block">Nama tampil
          <input v-model="form.displayName" required placeholder="A***" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Peran
          <input v-model="form.role" required placeholder="Mahasiswa S2" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block sm:col-span-2">Isi
          <textarea v-model="form.content" required rows="3" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
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
