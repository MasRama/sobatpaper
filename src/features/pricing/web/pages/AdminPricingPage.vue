<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { PricingGroup, PricingPackage } from '../../contract';
import { createPricingClient } from '../client';

const client = createPricingClient();

const groups = ref<PricingGroup[]>([]);
const editing = ref<PricingPackage | null>(null);
const isCreating = ref(false);
const isLoading = ref(true);
const errorMessage = ref('');
const formMessage = ref('');
const formError = ref('');
const isSaving = ref(false);

const form = ref({ groupSlug: '', groupName: '', name: '', price: 0, unit: '', note: '', sortOrder: 0 });

function resetForm(): void {
  form.value = { groupSlug: '', groupName: '', name: '', price: 0, unit: '', note: '', sortOrder: 0 };
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
    groups.value = response.data.groups;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat harga';
  } finally {
    isLoading.value = false;
  }
}

function startCreate(group?: PricingGroup): void {
  resetForm();
  if (group) {
    form.value.groupSlug = group.slug;
    form.value.groupName = group.name;
  }
  editing.value = null;
  isCreating.value = true;
  formMessage.value = '';
  formError.value = '';
}

function startEdit(pkg: PricingPackage): void {
  form.value = {
    groupSlug: pkg.groupSlug,
    groupName: pkg.groupName,
    name: pkg.name,
    price: pkg.price,
    unit: pkg.unit ?? '',
    note: pkg.note ?? '',
    sortOrder: 0,
  };
  editing.value = pkg;
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
        groupSlug: form.value.groupSlug,
        groupName: form.value.groupName,
        name: form.value.name,
        price: Number(form.value.price),
        unit: form.value.unit.trim() || null,
        note: form.value.note.trim() || null,
        sortOrder: Number(form.value.sortOrder),
      });
      if (!response.success) {
        formError.value = response.message;
        return;
      }
      formMessage.value = 'Paket berhasil dibuat.';
    } else if (editing.value) {
      const response = await client.update(editing.value.id, {
        groupSlug: form.value.groupSlug,
        groupName: form.value.groupName,
        name: form.value.name,
        price: Number(form.value.price),
        unit: form.value.unit.trim() || null,
        note: form.value.note.trim() || null,
        sortOrder: Number(form.value.sortOrder),
      });
      if (!response.success) {
        formError.value = response.message;
        return;
      }
      formMessage.value = 'Paket berhasil diperbarui.';
    }
    isCreating.value = false;
    editing.value = null;
    await load();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Gagal menyimpan paket';
  } finally {
    isSaving.value = false;
  }
}

async function remove(pkg: PricingPackage): Promise<void> {
  if (!window.confirm(`Hapus paket "${pkg.name}"?`)) return;
  const response = await client.remove(pkg.id);
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
      <h1 class="font-heading text-3xl font-semibold tracking-tight">Harga</h1>
      <button type="button" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" @click="startCreate()">
        Tambah paket
      </button>
    </div>

    <p v-if="isLoading" class="mt-6 text-sm text-muted-foreground">Memuat harga…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      {{ errorMessage }}
    </p>
    <div v-else class="mt-6 space-y-6">
      <section v-for="group in groups" :key="group.slug" class="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <div class="flex items-center justify-between px-4 py-3">
          <h2 class="font-heading text-base font-semibold">{{ group.name }}</h2>
          <button type="button" class="text-sm font-semibold text-primary hover:underline" @click="startCreate(group)">
            + Paket di grup ini
          </button>
        </div>
        <table class="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr class="border-y border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th class="px-4 py-2">Nama</th>
              <th class="px-4 py-2">Harga</th>
              <th class="px-4 py-2">Satuan</th>
              <th class="px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pkg in group.packages" :key="pkg.id" class="border-b border-border last:border-0">
              <td class="px-4 py-2 font-medium">{{ pkg.name }}</td>
              <td class="px-4 py-2">{{ pkg.price }}</td>
              <td class="px-4 py-2">{{ pkg.unit ?? '—' }}</td>
              <td class="px-4 py-2">
                <div class="flex gap-2">
                  <button type="button" class="font-semibold text-primary hover:underline" @click="startEdit(pkg)">Ubah</button>
                  <button type="button" class="font-semibold text-destructive hover:underline" @click="remove(pkg)">Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <section v-if="isCreating || editing" class="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft" aria-label="Form paket">
      <h2 class="font-heading text-base font-semibold">{{ isCreating ? 'Tambah paket' : `Ubah: ${editing?.name}` }}</h2>
      <form class="mt-4 grid gap-3 text-sm sm:grid-cols-2" @submit.prevent="save">
        <label class="block">Slug grup
          <input v-model="form.groupSlug" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Nama grup
          <input v-model="form.groupName" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Nama paket
          <input v-model="form.name" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Harga (Rp)
          <input v-model.number="form.price" type="number" min="0" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Satuan (opsional)
          <input v-model="form.unit" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block">Urutan
          <input v-model.number="form.sortOrder" type="number" min="0" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
        </label>
        <label class="block sm:col-span-2">Catatan (opsional)
          <textarea v-model="form.note" rows="2" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
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
