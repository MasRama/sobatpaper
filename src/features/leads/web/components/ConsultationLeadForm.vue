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
  <form v-if="!isSubmitted" class="space-y-5 font-['Plus_Jakarta_Sans']" @submit.prevent="submit">
    <div>
      <label class="text-xs font-bold text-[#555b65] dark:text-[#b1b6bf]" for="consult-name">Nama</label>
      <input
        id="consult-name"
        v-model="form.name"
        required
        autocomplete="name"
        class="mt-2 w-full rounded-[1rem] border border-[#d6d1c8] bg-white/55 px-4 py-3 text-sm outline-none transition focus:border-[#315bd6] dark:border-white/15 dark:bg-white/[0.035] dark:focus:border-[#9eb6ff]"
        placeholder="Nama kamu"
      />
    </div>
    <div>
      <label class="text-xs font-bold text-[#555b65] dark:text-[#b1b6bf]" for="consult-whatsapp">WhatsApp</label>
      <input
        id="consult-whatsapp"
        v-model="form.whatsapp"
        required
        inputmode="tel"
        autocomplete="tel"
        class="mt-2 w-full rounded-[1rem] border border-[#d6d1c8] bg-white/55 px-4 py-3 text-sm outline-none transition focus:border-[#315bd6] dark:border-white/15 dark:bg-white/[0.035] dark:focus:border-[#9eb6ff]"
        placeholder="08xxxxxxxxxx"
      />
    </div>
    <div>
      <label class="text-xs font-bold text-[#555b65] dark:text-[#b1b6bf]" for="consult-need">Ceritakan kebutuhanmu</label>
      <textarea
        id="consult-need"
        v-model="form.need"
        required
        rows="3"
        class="mt-2 w-full resize-none rounded-[1rem] border border-[#d6d1c8] bg-white/55 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#315bd6] dark:border-white/15 dark:bg-white/[0.035] dark:focus:border-[#9eb6ff]"
        :placeholder="serviceName ? `Apa yang perlu dibantu untuk ${serviceName}?` : 'Apa yang perlu dibantu?'"
      />
    </div>
    <p v-if="errorMessage" role="alert" class="text-xs text-[#b9472f]">{{ errorMessage }}</p>
    <button
      type="submit"
      :disabled="isSubmitting"
      class="w-full rounded-[1rem] bg-[#17191e] px-4 py-3.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 dark:bg-[#f4f2ed] dark:text-[#17191e]"
    >
      {{ buttonLabel }}
    </button>
    <p class="text-[11px] leading-5 text-[#858b94] dark:text-[#8f959f]">
      Setelah dikirim, WhatsApp akan terbuka untuk melanjutkan konsultasi.
    </p>
  </form>
  <div v-else class="border-y border-[#dcd8d0] py-5 text-sm dark:border-white/10">
    <p class="font-bold">Data konsultasi sudah tercatat.</p>
    <a :href="whatsappHref" target="_blank" rel="noreferrer" class="mt-2 inline-block font-bold text-[#315bd6] dark:text-[#9eb6ff]">
      Buka WhatsApp lagi
    </a>
  </div>
</template>
