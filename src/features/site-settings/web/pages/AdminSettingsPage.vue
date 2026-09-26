<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { createSiteSettingsAdminClient, useSiteSettings, type SettingKey } from '../index';

const { settings, load } = useSiteSettings();
const adminClient = createSiteSettingsAdminClient();

const values = ref<Record<SettingKey, string>>({ whatsapp_number: '', consultation_message: '' });
const isLoading = ref(true);
const messages = ref<Record<SettingKey, string>>({ whatsapp_number: '', consultation_message: '' });
const errors = ref<Record<SettingKey, string>>({ whatsapp_number: '', consultation_message: '' });
const isSaving = ref<Record<SettingKey, boolean>>({ whatsapp_number: false, consultation_message: false });

const FIELDS: Array<{ key: SettingKey; label: string; hint: string; multiline: boolean }> = [
  {
    key: 'whatsapp_number',
    label: 'Nomor WhatsApp',
    hint: 'Format angka internasional tanpa +, contoh: 628123456789',
    multiline: false,
  },
  {
    key: 'consultation_message',
    label: 'Template pesan konsultasi',
    hint: 'Pesan bawaan saat pengunjung menekan tombol konsultasi umum.',
    multiline: true,
  },
];

function sourceValue(key: SettingKey): string {
  return key === 'whatsapp_number' ? settings.value.whatsappNumber : settings.value.consultationMessage;
}

async function save(key: SettingKey): Promise<void> {
  if (isSaving.value[key]) return;
  isSaving.value[key] = true;
  messages.value[key] = '';
  errors.value[key] = '';
  try {
    const response = await adminClient.update(key, values.value[key]);
    if (!response.success) {
      errors.value[key] = response.message;
      return;
    }
    messages.value[key] = 'Pengaturan tersimpan.';
    await load();
  } catch (error) {
    errors.value[key] = error instanceof Error ? error.message : 'Gagal menyimpan pengaturan';
  } finally {
    isSaving.value[key] = false;
  }
}

onMounted(async () => {
  await load();
  values.value = { whatsapp_number: sourceValue('whatsapp_number'), consultation_message: sourceValue('consultation_message') };
  isLoading.value = false;
});
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10 lg:px-8">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Admin</p>
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight">Pengaturan</h1>
    <p class="mt-3 text-sm text-muted-foreground">Perubahan berlaku langsung tanpa deploy ulang.</p>

    <p v-if="isLoading" class="mt-6 text-sm text-muted-foreground">Memuat pengaturan…</p>
    <div v-else class="mt-6 grid gap-6 lg:grid-cols-2">
      <section
        v-for="field in FIELDS"
        :key="field.key"
        class="rounded-2xl border border-border bg-card p-6 shadow-soft"
        :aria-label="field.label"
      >
        <h2 class="font-heading text-base font-semibold">{{ field.label }}</h2>
        <p class="mt-1 text-xs text-muted-foreground">{{ field.hint }}</p>
        <form class="mt-4 space-y-3" @submit.prevent="save(field.key)">
          <textarea
            v-if="field.multiline"
            v-model="values[field.key]"
            rows="4"
            required
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            v-else
            v-model="values[field.key]"
            required
            pattern="\+?[0-9]{9,16}"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <p v-if="messages[field.key]" role="status" class="text-sm text-primary">{{ messages[field.key] }}</p>
          <p v-if="errors[field.key]" role="alert" class="text-sm text-destructive">{{ errors[field.key] }}</p>
          <button
            type="submit"
            :disabled="isSaving[field.key]"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {{ isSaving[field.key] ? 'Menyimpan…' : 'Simpan' }}
          </button>
        </form>
      </section>
    </div>
  </main>
</template>
