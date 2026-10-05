<script setup lang="ts">
import { computed, ref } from 'vue';
import { createAnalyticsClient } from '../../../analytics/web';
import { createLeadsClient } from '../client';

const props = defineProps<{
  serviceSlug?: string;
  serviceName?: string;
  whatsappHref: string;
}>();

const client = createLeadsClient();
const analytics = createAnalyticsClient();
const form = ref({ name: '', whatsapp: '', need: '' });
const isSubmitting = ref(false);
const errorMessage = ref('');
const isSubmitted = ref(false);

const buttonLabel = computed(() => (isSubmitting.value ? 'Mengirim…' : 'Lanjut ke WhatsApp'));

async function submit(): Promise<void> {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  errorMessage.value = '';
  try {
    const response = await client.create({
      name: form.value.name,
      whatsapp: form.value.whatsapp.replace(/[\s()-]/g, ''),
      need: form.value.need,
      serviceSlug: props.serviceSlug ?? null,
    });
    if (!response.success) {
      errorMessage.value = response.message;
      return;
    }
    isSubmitted.value = true;
    analytics.track('click_whatsapp', {
      path: window.location.pathname,
      service: props.serviceSlug ?? null,
    });
    window.location.assign(props.whatsappHref);
  } catch {
    errorMessage.value = 'Konsultasi belum bisa dikirim. Coba lagi sebentar.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <form v-if="!isSubmitted" class="space-y-3" @submit.prevent="submit">
    <div>
      <label class="text-xs font-medium" for="consult-name">Nama</label>
      <input
        id="consult-name"
        v-model="form.name"
        required
        autocomplete="name"
        class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder="Nama kamu"
      />
    </div>
    <div>
      <label class="text-xs font-medium" for="consult-whatsapp">WhatsApp</label>
      <input
        id="consult-whatsapp"
        v-model="form.whatsapp"
        required
        inputmode="tel"
        autocomplete="tel"
        class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder="08xxxxxxxxxx"
      />
    </div>
    <div>
      <label class="text-xs font-medium" for="consult-need">Ceritakan kebutuhanmu</label>
      <textarea
        id="consult-need"
        v-model="form.need"
        required
        rows="3"
        class="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm"
        :placeholder="serviceName ? `Apa yang perlu dibantu untuk ${serviceName}?` : 'Apa yang perlu dibantu?'"
      />
    </div>
    <p v-if="errorMessage" role="alert" class="text-xs text-destructive">{{ errorMessage }}</p>
    <button
      type="submit"
      :disabled="isSubmitting"
      class="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {{ buttonLabel }}
    </button>
    <p class="text-[11px] leading-relaxed text-muted-foreground">
      Setelah dikirim, WhatsApp akan terbuka untuk melanjutkan konsultasi.
    </p>
  </form>
  <div v-else class="rounded-xl bg-primary/10 p-4 text-sm">
    <p class="font-semibold text-primary">Data konsultasi sudah tercatat.</p>
    <a :href="whatsappHref" target="_blank" rel="noreferrer" class="mt-2 inline-block font-semibold text-primary hover:underline">
      Buka WhatsApp lagi
    </a>
  </div>
</template>
