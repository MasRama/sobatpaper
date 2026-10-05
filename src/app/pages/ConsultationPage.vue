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
  <main class="bg-[#f7f5f2] font-['Plus_Jakarta_Sans'] text-[#17191e] dark:bg-[#0d0f13] dark:text-[#f4f2ed]">
    <section class="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-24">
      <RouterLink to="/layanan" class="text-xs font-bold text-[#777d87] transition hover:text-[#17191e] dark:text-[#9da3ad] dark:hover:text-white">← Kembali ke layanan</RouterLink>

      <div class="mt-8 grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <section>
          <p class="text-xs font-extrabold text-[#ff704d]">Konsultasi</p>
          <h1 class="mt-4 max-w-[650px] text-[clamp(3rem,6vw,5.35rem)] font-semibold leading-[0.96] tracking-[-0.06em]">
            Ceritakan dulu. <span class="font-['Instrument_Serif'] font-normal italic text-[#315bd6] dark:text-[#9eb6ff]">Nggak harus rapi.</span>
          </h1>
          <p class="mt-6 max-w-[560px] text-[15px] leading-8 text-[#666c76] dark:text-[#a5abb4]">
            Bawa konteks seadanya: topik, draft, data, deadline, atau bagian yang bikin mentok. Data ini membantu tim memahami kebutuhan sebelum percakapan dilanjutkan lewat WhatsApp.
          </p>
          <p class="mt-4 text-sm font-semibold text-[#555b65] dark:text-[#b1b6bf]">Tidak perlu email dan tidak perlu membuat akun.</p>

          <div v-if="serviceName" class="mt-8 border-y border-[#dcd8d0] py-5 text-sm dark:border-white/10">
            <span class="text-xs font-semibold text-[#858b94] dark:text-[#8f959f]">Layanan yang diminati</span>
            <p class="mt-1.5 font-bold">{{ serviceName }}</p>
          </div>
          <p v-else-if="isLoadingService" class="mt-8 text-sm text-[#747a84] dark:text-[#9da3ad]">Memuat konteks layanan…</p>
        </section>

        <section class="border-t border-[#dcd8d0] pt-7 dark:border-white/10 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0" aria-label="Form konsultasi">
          <ConsultationLeadForm
            :service-slug="serviceSlug || undefined"
            :service-name="serviceName || undefined"
            :whatsapp-href="whatsappHref"
          />
        </section>
      </div>
    </section>
  </main>
</template>
