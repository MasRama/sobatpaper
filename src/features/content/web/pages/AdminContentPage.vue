<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { ContentPage, Faq } from '../../contract';
import { createContentClient } from '../client';

const client = createContentClient();

const PAGE_SLUGS = ['tentang-kami', 'kebijakan-privasi', 'syarat-ketentuan', 'kebijakan-refund', 'disclaimer'] as const;

const pages = ref<ContentPage[]>([]);
const selectedSlug = ref<string>(PAGE_SLUGS[0]);
const pageForm = ref({ title: '', body: '' });
const pageMessage = ref('');
const pageError = ref('');
const isSavingPage = ref(false);

const faqs = ref<Faq[]>([]);
const editingFaq = ref<Faq | null>(null);
const isCreatingFaq = ref(false);
const faqForm = ref({ category: '', question: '', answer: '', sortOrder: 0 });
const faqMessage = ref('');
const faqError = ref('');
const isSavingFaq = ref(false);

const isLoading = ref(true);
const errorMessage = ref('');

async function load(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const loaded: ContentPage[] = [];
    for (const slug of PAGE_SLUGS) {
      const response = await client.page(slug);
      if (response.success) loaded.push(response.data.page);
    }
    pages.value = loaded;
    const current = loaded.find((page) => page.slug === selectedSlug.value) ?? loaded[0];
    if (current) {
      selectedSlug.value = current.slug;
      pageForm.value = { title: current.title, body: current.body };
    }
    const faqResponse = await client.faqs();
    if (faqResponse.success) faqs.value = faqResponse.data.faqs;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat konten';
  } finally {
    isLoading.value = false;
  }
}

function selectPage(slug: string): void {
  selectedSlug.value = slug;
  pageMessage.value = '';
  pageError.value = '';
  const page = pages.value.find((entry) => entry.slug === slug);
  if (page) pageForm.value = { title: page.title, body: page.body };
}

async function savePage(): Promise<void> {
  if (isSavingPage.value) return;
  isSavingPage.value = true;
  pageMessage.value = '';
  pageError.value = '';
  try {
    const response = await client.updatePage(selectedSlug.value, { title: pageForm.value.title, body: pageForm.value.body });
    if (!response.success) {
      pageError.value = response.message;
      return;
    }
    pageMessage.value = 'Halaman berhasil diperbarui.';
    await load();
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Gagal menyimpan halaman';
  } finally {
    isSavingPage.value = false;
  }
}

function startCreateFaq(): void {
  faqForm.value = { category: '', question: '', answer: '', sortOrder: 0 };
  editingFaq.value = null;
  isCreatingFaq.value = true;
  faqMessage.value = '';
  faqError.value = '';
}

function startEditFaq(faq: Faq): void {
  faqForm.value = { category: faq.category, question: faq.question, answer: faq.answer, sortOrder: 0 };
  editingFaq.value = faq;
  isCreatingFaq.value = false;
  faqMessage.value = '';
  faqError.value = '';
}

async function saveFaq(): Promise<void> {
  if (isSavingFaq.value) return;
  isSavingFaq.value = true;
  faqMessage.value = '';
  faqError.value = '';
  try {
    if (isCreatingFaq.value) {
      const response = await client.createFaq({
        category: faqForm.value.category,
        question: faqForm.value.question,
        answer: faqForm.value.answer,
        sortOrder: Number(faqForm.value.sortOrder),
      });
      if (!response.success) {
        faqError.value = response.message;
        return;
      }
      faqMessage.value = 'FAQ berhasil dibuat.';
    } else if (editingFaq.value) {
      const response = await client.updateFaq(editingFaq.value.id, {
        category: faqForm.value.category,
        question: faqForm.value.question,
        answer: faqForm.value.answer,
        sortOrder: Number(faqForm.value.sortOrder),
      });
      if (!response.success) {
        faqError.value = response.message;
        return;
      }
      faqMessage.value = 'FAQ berhasil diperbarui.';
    }
    isCreatingFaq.value = false;
    editingFaq.value = null;
    await load();
  } catch (error) {
    faqError.value = error instanceof Error ? error.message : 'Gagal menyimpan FAQ';
  } finally {
    isSavingFaq.value = false;
  }
}

async function removeFaq(faq: Faq): Promise<void> {
  if (!window.confirm('Hapus FAQ ini?')) return;
  const response = await client.removeFaq(faq.id);
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
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight">Konten & FAQ</h1>

    <p v-if="isLoading" class="mt-6 text-sm text-muted-foreground">Memuat konten…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      {{ errorMessage }}
    </p>
    <template v-else>
      <section class="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft" aria-label="Halaman statis">
        <h2 class="font-heading text-base font-semibold">Halaman statis</h2>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="slug in PAGE_SLUGS"
            :key="slug"
            type="button"
            class="rounded-lg border px-3 py-1 text-sm"
            :class="selectedSlug === slug ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-border'"
            @click="selectPage(slug)"
          >
            {{ slug }}
          </button>
        </div>
        <form class="mt-4 grid gap-3 text-sm" @submit.prevent="savePage">
          <label class="block">Judul
            <input v-model="pageForm.title" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          </label>
          <label class="block">Isi (teks/markdown sederhana)
            <textarea v-model="pageForm.body" required rows="10" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs" />
          </label>
          <p v-if="pageMessage" role="status" class="text-sm text-primary">{{ pageMessage }}</p>
          <p v-if="pageError" role="alert" class="text-sm text-destructive">{{ pageError }}</p>
          <div>
            <button type="submit" :disabled="isSavingPage" class="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">
              {{ isSavingPage ? 'Menyimpan…' : 'Simpan halaman' }}
            </button>
          </div>
        </form>
      </section>

      <section class="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft" aria-label="Daftar FAQ">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-heading text-base font-semibold">FAQ ({{ faqs.length }})</h2>
          <button type="button" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" @click="startCreateFaq">
            Tambah FAQ
          </button>
        </div>
        <div class="mt-4 space-y-2 text-sm">
          <article v-for="faq in faqs" :key="faq.id" class="rounded-lg border border-border p-3">
            <p class="font-medium">{{ faq.question }}</p>
            <p class="mt-1 text-muted-foreground">{{ faq.category }}</p>
            <div class="mt-2 flex gap-2">
              <button type="button" class="font-semibold text-primary hover:underline" @click="startEditFaq(faq)">Ubah</button>
              <button type="button" class="font-semibold text-destructive hover:underline" @click="removeFaq(faq)">Hapus</button>
            </div>
          </article>
        </div>

        <form v-if="isCreatingFaq || editingFaq" class="mt-4 grid gap-3 border-t border-border pt-4 text-sm" @submit.prevent="saveFaq">
          <h3 class="font-heading text-sm font-semibold">{{ isCreatingFaq ? 'Tambah FAQ' : 'Ubah FAQ' }}</h3>
          <label class="block">Kategori
            <input v-model="faqForm.category" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          </label>
          <label class="block">Pertanyaan
            <input v-model="faqForm.question" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          </label>
          <label class="block">Jawaban
            <textarea v-model="faqForm.answer" required rows="3" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          </label>
          <label class="block">Urutan
            <input v-model.number="faqForm.sortOrder" type="number" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
          </label>
          <p v-if="faqMessage" role="status" class="text-sm text-primary">{{ faqMessage }}</p>
          <p v-if="faqError" role="alert" class="text-sm text-destructive">{{ faqError }}</p>
          <div class="flex gap-2">
            <button type="submit" :disabled="isSavingFaq" class="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">
              {{ isSavingFaq ? 'Menyimpan…' : 'Simpan' }}
            </button>
            <button type="button" class="rounded-lg border border-border px-4 py-2 font-semibold" @click="isCreatingFaq = false; editingFaq = null;">
              Batal
            </button>
          </div>
        </form>
      </section>
    </template>
  </main>
</template>
