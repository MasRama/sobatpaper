<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { ConsultationLeadForm } from '../../features/leads/web';
import { createServicesClient } from '../../features/services/web';
import { useSiteSettings } from '../../features/site-settings/web';
import { setPageHead } from '../../shared/web/head';

setPageHead({
  title: 'Konsultasi — SobatPaper.id',
  description: 'Ceritakan kebutuhan riset atau penulisan akademikmu. Data konsultasi akan dicatat sebelum percakapan dilanjutkan melalui WhatsApp.',
  path: '/konsultasi',
});

const route = useRoute();
const servicesClient = createServicesClient();
const { linkFor, load: loadSettings } = useSiteSettings();

const serviceSlug = ref('');
const serviceName = ref('');
const isLoadingService = ref(false);

const whatsappHref = computed(() => {
  const context = serviceName.value ? ` layanan ${serviceName.value}` : '';
  return linkFor(`Halo SobatPaper, saya ingin melanjutkan konsultasi${context}.`);
});

onMounted(async () => {
  await loadSettings();
  const queryService = typeof route.query.service === 'string' ? route.query.service : '';
  if (!queryService) return;

  isLoadingService.value = true;
  try {
    const response = await servicesClient.detail(queryService);
    if (response.success) {
      serviceSlug.value = response.data.service.slug;
      serviceName.value = response.data.service.name;
    }
  } finally {
    isLoadingService.value = false;
  }
});
</script>

<template>
  <main class="mx-auto max-w-3xl px-6 py-12 lg:px-8 lg:py-16">
    <RouterLink to="/layanan" class="text-sm font-semibold text-primary hover:underline">← Lihat layanan</RouterLink>
    <div class="mt-5 grid gap-8 md:grid-cols-[1fr_0.9fr] md:items-start">
      <section>
        <p class="font-heading text-xs uppercase tracking-[0.22em] text-primary">Konsultasi</p>
        <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Ceritakan kebutuhanmu dulu.</h1>
        <p class="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          Data ini membantu tim memahami konteks sebelum percakapan pindah ke WhatsApp. Tidak perlu email dan tidak perlu membuat akun.
        </p>
        <div v-if="serviceName" class="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm">
          <span class="text-muted-foreground">Layanan yang diminati</span>
          <p class="mt-1 font-semibold">{{ serviceName }}</p>
        </div>
        <p v-else-if="isLoadingService" class="mt-6 text-sm text-muted-foreground">Memuat konteks layanan…</p>
      </section>

      <section class="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6" aria-label="Form konsultasi">
        <ConsultationLeadForm
          :service-slug="serviceSlug || undefined"
          :service-name="serviceName || undefined"
          :whatsapp-href="whatsappHref"
        />
      </section>
    </div>
  </main>
</template>
