<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { createContentClient, type Faq } from '../../features/content/web';
import { createPortfolioClient, type PortfolioItem } from '../../features/portfolio/web';
import { createPricingClient, type PricingGroup } from '../../features/pricing/web';
import { createServicesClient, formatIDR, type ServiceSummary } from '../../features/services/web';
import { useSiteSettings } from '../../features/site-settings/web';
import { TestimonialsSection } from '../../features/testimonials/web';
import { setPageHead } from '../../shared/web/head';

setPageHead({
  title: 'SobatPaper.id — Academic Research Partner',
  description: 'SobatPaper membantu penelitian, analisis data, penulisan ilmiah, editing, dan publikasi artikel jurnal untuk mahasiswa, dosen, dan peneliti.',
  path: '/',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SobatPaper.id',
    slogan: 'Academic Research Partner',
    description: 'Pendampingan riset dan penulisan akademik: skripsi, tesis, analisis data, editing, dan publikasi jurnal.',
  },
});

const { consultLink } = useSiteSettings();
const servicesClient = createServicesClient();
const pricingClient = createPricingClient();
const portfolioClient = createPortfolioClient();
const contentClient = createContentClient();

const services = ref<ServiceSummary[]>([]);
const pricingGroups = ref<PricingGroup[]>([]);
const portfolioItems = ref<PortfolioItem[]>([]);
const faqs = ref<Faq[]>([]);

const SERVICE_ICONS = ['✦', '↗', '∿', 'Aa', '◎', '⌁'] as const;

const PROCESS = [
  ['01', 'Ceritakan dulu', 'Kirim konteks riset, posisi progres, kebutuhan, dan deadline kamu.'],
  ['02', 'Kita petakan', 'Scope, output, timeline, dan biaya dibuat jelas sebelum mulai.'],
  ['03', 'Kerja bareng', 'Progres dibagi per tahap supaya tetap mudah kamu review dan arahkan.'],
  ['04', 'Rapikan sampai final', 'Revisi diselesaikan sampai output siap dipakai untuk kebutuhan akademikmu.'],
] as const;

const TRUST_ITEMS = [
  ['Profesional', 'Standar kerja akademik yang jelas.'],
  ['Terpercaya', 'Dokumen dan konteks riset dijaga.'],
  ['Tepat Waktu', 'Timeline disepakati sejak awal.'],
  ['Konsultasi', 'Scope dipetakan sebelum mulai.'],
  ['Transparan', 'Proses dan estimasi biaya terbuka.'],
] as const;

function groupStartingPrice(group: PricingGroup): number {
  if (group.packages.length === 0) return 0;
  return Math.min(...group.packages.map((item) => item.price));
}

onMounted(async () => {
  const [servicesResult, pricingResult, portfolioResult, faqResult] = await Promise.allSettled([
    servicesClient.list(),
    pricingClient.list(),
    portfolioClient.list(),
    contentClient.faqs('umum'),
  ]);

  if (servicesResult.status === 'fulfilled' && servicesResult.value.success) {
    services.value = servicesResult.value.data.services;
  }
  if (pricingResult.status === 'fulfilled' && pricingResult.value.success) {
    pricingGroups.value = pricingResult.value.data.groups;
  }
  if (portfolioResult.status === 'fulfilled' && portfolioResult.value.success) {
    portfolioItems.value = portfolioResult.value.data.items.slice(0, 3);
  }
  if (faqResult.status === 'fulfilled' && faqResult.value.success) {
    faqs.value = faqResult.value.data.faqs.slice(0, 4);
  }
});
</script>

<template>
  <main class="home-page bg-[#f7f5f2] text-[#17191e] dark:bg-[#0d0f13] dark:text-[#f4f2ed]">
    <section class="relative overflow-hidden">
      <div class="hero-splotch hero-splotch-one" aria-hidden="true"></div>
      <div class="hero-splotch hero-splotch-two" aria-hidden="true"></div>

      <div class="relative mx-auto grid min-h-[calc(100svh-5rem)] max-w-[1240px] items-center gap-14 px-6 pb-20 pt-14 lg:grid-cols-[1.04fr_0.96fr] lg:px-10 lg:pb-24 lg:pt-16">
        <div class="max-w-[720px]">
          <div class="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9d5cd] bg-white/70 px-3.5 py-2 text-[12px] font-semibold text-[#5d6470] shadow-[0_8px_30px_rgba(31,36,48,0.05)] backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-[#aeb5c0]">
            <span class="h-2 w-2 rounded-full bg-[#ff7a59]"></span>
            Partner riset dari ide sampai publikasi
          </div>

          <h1 class="home-display text-[clamp(3.45rem,7.7vw,7.2rem)] font-semibold leading-[0.91] tracking-[-0.065em]">
            Riset nggak harus
            <span class="home-serif block font-normal italic tracking-[-0.045em] text-[#315bd6] dark:text-[#9eb6ff]">seribet itu.</span>
          </h1>

          <p class="mt-7 max-w-[620px] text-[17px] leading-8 text-[#646a74] dark:text-[#a5abb4] sm:text-[19px]">
            Bawa topik, data, draft, atau bahkan kebingunganmu. SobatPaper bantu bikin proses riset jadi lebih jelas, lebih rapi, dan lebih enak dijalani.
          </p>

          <div class="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              :href="consultLink"
              target="_blank"
              rel="noreferrer"
              class="home-primary-cta group inline-flex min-h-14 items-center justify-center gap-5 rounded-full bg-[#17191e] px-7 text-sm font-bold text-white shadow-[0_14px_35px_rgba(23,25,30,0.16)] transition-transform hover:-translate-y-0.5 dark:bg-[#f4f2ed] dark:text-[#17191e]"
            >
              Ceritakan kebutuhanmu
              <span class="text-base transition-transform group-hover:translate-x-1">↗</span>
            </a>
            <RouterLink
              to="/layanan"
              class="inline-flex min-h-14 items-center justify-center rounded-full border border-[#d4d0c8] bg-white/45 px-7 text-sm font-bold transition-colors hover:bg-white dark:border-white/15 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"
            >
              Lihat layanan
            </RouterLink>
          </div>

          <div class="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-semibold text-[#7b818b] dark:text-[#8e949e]">
            <span>Untuk mahasiswa</span><span class="text-[#d1ccc2] dark:text-white/20">•</span>
            <span>Dosen & peneliti</span><span class="text-[#d1ccc2] dark:text-white/20">•</span>
            <span>Guru</span><span class="text-[#d1ccc2] dark:text-white/20">•</span>
            <span>Tim akademik</span>
          </div>
        </div>

        <div class="relative mx-auto w-full max-w-[520px] lg:mr-0">
          <div class="research-canvas relative min-h-[520px] overflow-hidden rounded-[2.6rem] bg-[#1f3167] p-6 text-white shadow-[0_32px_80px_rgba(30,49,103,0.18)] sm:p-8 dark:bg-[#18254f]">
            <div class="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#ff8d6d] opacity-90" aria-hidden="true"></div>
            <div class="absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-[#f2cb67]" aria-hidden="true"></div>

            <div class="relative z-10 flex items-center justify-between">
              <span class="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white/80">Research workspace</span>
              <span class="text-sm text-white/65">sobatpaper.id</span>
            </div>

            <div class="relative z-10 mt-14 max-w-[390px]">
              <p class="text-[13px] font-semibold text-[#ffcfbf]">Mulai dari pertanyaan yang tepat.</p>
              <p class="mt-3 text-[clamp(2rem,5vw,3.3rem)] font-semibold leading-[1.03] tracking-[-0.045em]">
                “Sebenarnya, apa yang ingin riset ini buktikan?”
              </p>
            </div>

            <div class="relative z-10 mt-12 grid gap-3 sm:grid-cols-2">
              <div class="rounded-[1.6rem] bg-[#f8f4eb] p-5 text-[#21232a] shadow-[0_14px_35px_rgba(9,17,45,0.16)] sm:-rotate-2">
                <div class="flex items-center justify-between text-[11px] font-bold text-[#8a8e97]">
                  <span>01 · DEFINE</span><span>✦</span>
                </div>
                <p class="mt-4 text-[15px] font-bold leading-6">Rapikan problem, research gap, dan arah penelitian.</p>
              </div>
              <div class="rounded-[1.6rem] bg-[#ff8d6d] p-5 text-[#2c1b17] shadow-[0_14px_35px_rgba(9,17,45,0.14)] sm:translate-y-6 sm:rotate-2">
                <div class="flex items-center justify-between text-[11px] font-bold text-[#6f392b]">
                  <span>02 · BUILD</span><span>↗</span>
                </div>
                <p class="mt-4 text-[15px] font-bold leading-6">Pilih metode, olah data, lalu bangun argumen yang nyambung.</p>
              </div>
            </div>

            <div class="relative z-10 mt-11 flex items-center justify-between text-[11px] font-semibold text-white/60">
              <span>Idea</span><span>→</span><span>Method</span><span>→</span><span>Evidence</span><span>→</span><span>Manuscript</span>
            </div>
          </div>

          <div class="absolute -left-5 top-16 hidden rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#315bd6] shadow-[0_12px_32px_rgba(34,42,73,0.12)] sm:block dark:bg-[#f4f2ed] dark:text-[#315bd6]">
            ✦ Ide jadi lebih fokus
          </div>
          <div class="absolute -bottom-5 right-8 hidden rounded-full bg-[#f3ca63] px-4 py-2.5 text-xs font-bold text-[#473813] shadow-[0_12px_32px_rgba(34,42,73,0.12)] sm:block">
            Deadline tetap kebawa
          </div>
        </div>
      </div>
    </section>

    <section class="border-y border-[#e4e0d8] bg-white/45 dark:border-white/10 dark:bg-white/[0.02]">
      <div class="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-8 gap-y-4 px-6 py-5 text-[13px] font-bold text-[#6e747e] lg:px-10 dark:text-[#9298a2]">
        <span>Pendampingan Skripsi</span><span class="text-[#ff8d6d]">✦</span>
        <span>Tesis</span><span class="text-[#315bd6]">✦</span>
        <span>Analisis Data</span><span class="text-[#f0bf42]">✦</span>
        <span>Editing & Formatting</span><span class="text-[#ff8d6d]">✦</span>
        <span>Artikel Jurnal</span>
      </div>
    </section>

    <section class="mx-auto max-w-[1240px] px-6 py-14 lg:px-10 lg:py-18" aria-label="Kepercayaan SobatPaper">
      <div class="grid border-y border-[#dedad2] dark:border-white/10 sm:grid-cols-2 lg:grid-cols-5">
        <div
          v-for="(item, index) in TRUST_ITEMS"
          :key="item[0]"
          class="border-b border-[#dedad2] px-1 py-5 last:border-b-0 dark:border-white/10 sm:px-5 lg:border-b-0 lg:border-r lg:last:border-r-0"
          :class="index % 2 === 0 ? 'sm:border-r sm:last:border-r-0' : 'sm:border-r-0 lg:border-r'"
        >
          <p class="text-sm font-extrabold tracking-[-0.02em]">{{ item[0] }}</p>
          <p class="mt-1.5 text-xs leading-5 text-[#777d87] dark:text-[#999fa9]">{{ item[1] }}</p>
        </div>
      </div>
    </section>

    <section v-if="services.length > 0" class="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-32" aria-labelledby="services-title">
      <div class="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <div>
          <p class="home-eyebrow">Yang bisa kami bantu</p>
          <h2 id="services-title" class="home-display mt-4 max-w-[460px] text-[clamp(2.7rem,5vw,4.7rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
            Datang bawa masalahnya. <span class="home-serif font-normal italic text-[#315bd6] dark:text-[#9eb6ff]">Kita cari titik beresnya.</span>
          </h2>
          <p class="mt-5 max-w-md text-[15px] leading-7 text-[#6a707a] dark:text-[#9ca2ac]">
            Nggak harus tahu nama layanan yang kamu butuhkan. Ceritakan kondisinya, kami bantu petakan dari sana.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <RouterLink
            v-for="(service, index) in services.slice(0, 6)"
            :key="service.slug"
            :to="`/layanan/${service.slug}`"
            class="service-card group min-h-[230px] rounded-[2rem] border border-[#e1ddd5] bg-white p-6 shadow-[0_16px_45px_rgba(35,39,48,0.045)] transition-all hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(35,39,48,0.09)] dark:border-white/10 dark:bg-[#15181e] dark:shadow-none dark:hover:border-white/20"
            :class="index === 0 || index === 5 ? 'sm:col-span-2' : ''"
          >
            <div class="flex items-start justify-between gap-4">
              <span class="grid h-11 w-11 place-items-center rounded-2xl bg-[#f1f3ff] text-lg font-bold text-[#315bd6] dark:bg-[#24325f] dark:text-[#a9bcff]">{{ SERVICE_ICONS[index] ?? '✦' }}</span>
              <span class="text-lg text-[#a2a7ae] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
            </div>
            <h3 class="mt-8 text-[22px] font-bold tracking-[-0.035em]">{{ service.name }}</h3>
            <p class="mt-2 max-w-lg text-sm leading-6 text-[#747a84] dark:text-[#969ca6]">{{ service.tagline }}</p>
            <p class="mt-6 text-xs font-bold text-[#4d5560] dark:text-[#b0b5bd]">Mulai {{ formatIDR(service.startingPrice) }}</p>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-[1300px] overflow-hidden rounded-[2.8rem] bg-[#17191e] text-white dark:bg-[#161a22]">
        <div class="grid gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-16 lg:py-20">
          <div>
            <p class="home-eyebrow !text-[#9eb6ff]">Cara kerja</p>
            <h2 class="home-display mt-4 max-w-[500px] text-[clamp(2.8rem,5vw,5rem)] font-semibold leading-[0.96] tracking-[-0.055em]">
              Tetap tahu <span class="home-serif font-normal italic text-[#ff9c80]">apa yang sedang terjadi.</span>
            </h2>
            <p class="mt-5 max-w-md text-[15px] leading-7 text-[#a8adb6]">Proses dibagi jelas supaya kamu nggak perlu menebak-nebak progres atau menunggu tanpa konteks.</p>
            <RouterLink to="/cara-kerja" class="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-[#ff9c80]">Lihat proses lengkap <span>↗</span></RouterLink>
          </div>

          <ol class="space-y-3">
            <li v-for="step in PROCESS" :key="step[0]" class="group grid gap-4 rounded-[1.7rem] border border-white/10 bg-white/[0.045] p-5 sm:grid-cols-[3rem_0.85fr_1.15fr] sm:items-start sm:p-6">
              <span class="text-xs font-bold text-[#ff9c80]">{{ step[0] }}</span>
              <h3 class="text-[17px] font-bold tracking-[-0.02em]">{{ step[1] }}</h3>
              <p class="text-sm leading-6 text-[#a8adb6]">{{ step[2] }}</p>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <section v-if="pricingGroups.length > 0" class="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-32" aria-labelledby="pricing-title">
      <div class="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-20">
        <div>
          <p class="home-eyebrow">Harga</p>
          <h2 id="pricing-title" class="home-display mt-4 max-w-[520px] text-[clamp(2.7rem,5vw,4.7rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
            Biar dari awal sudah <span class="home-serif font-normal italic text-[#315bd6] dark:text-[#9eb6ff]">punya gambaran.</span>
          </h2>
        </div>
        <p class="max-w-xl text-[15px] leading-7 text-[#6a707a] dark:text-[#9ca2ac] lg:justify-self-end">Harga final mengikuti scope. Tapi setidaknya kamu bisa melihat titik mulainya sebelum ngobrol lebih lanjut.</p>
      </div>

      <div class="mt-10 overflow-hidden rounded-[2.2rem] border border-[#dfdbd3] bg-white dark:border-white/10 dark:bg-[#15181e]">
        <div v-for="(group, index) in pricingGroups.slice(0, 3)" :key="group.slug" class="grid gap-4 border-b border-[#ebe7df] px-6 py-6 last:border-b-0 sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:px-8 dark:border-white/10">
          <span class="text-xs font-bold text-[#ff7a59]">0{{ index + 1 }}</span>
          <div>
            <h3 class="text-lg font-bold tracking-[-0.025em]">{{ group.name }}</h3>
            <p class="mt-1 text-xs text-[#868b94]">{{ group.packages.length }} pilihan layanan</p>
          </div>
          <div class="sm:text-right">
            <p class="text-xs font-semibold text-[#8a9099]">Mulai dari</p>
            <p class="mt-1 text-2xl font-bold tracking-[-0.04em]">{{ formatIDR(groupStartingPrice(group)) }}</p>
          </div>
        </div>
      </div>
      <RouterLink to="/harga" class="mt-7 inline-flex items-center gap-2 text-sm font-bold hover:text-[#315bd6] dark:hover:text-[#9eb6ff]">Lihat semua harga <span>↗</span></RouterLink>
    </section>

    <section v-if="portfolioItems.length > 0" class="bg-[#ece9ff] py-24 dark:bg-[#171a2c] lg:py-28" aria-labelledby="portfolio-title">
      <div class="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="home-eyebrow">Contoh pekerjaan</p>
            <h2 id="portfolio-title" class="home-display mt-4 max-w-[650px] text-[clamp(2.6rem,5vw,4.7rem)] font-semibold leading-[0.98] tracking-[-0.055em]">Beberapa hal yang pernah <span class="home-serif font-normal italic text-[#315bd6] dark:text-[#aebdff]">kami bantu rapikan.</span></h2>
          </div>
          <RouterLink to="/portfolio" class="inline-flex items-center gap-2 text-sm font-bold">Lihat portfolio <span>↗</span></RouterLink>
        </div>

        <div class="mt-10 grid gap-4 lg:grid-cols-3">
          <article v-for="item in portfolioItems" :key="item.id" class="rounded-[2rem] bg-[#f9f8ff] p-6 dark:bg-white/[0.055]">
            <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6c70a6] dark:text-[#aeb3de]">{{ item.category }}</p>
            <h3 class="mt-6 text-[22px] font-bold leading-7 tracking-[-0.035em]">{{ item.title }}</h3>
            <p class="mt-3 text-sm leading-6 text-[#6e7280] dark:text-[#a5a9b6]">{{ item.summary }}</p>
          </article>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-32">
      <TestimonialsSection :limit="4" />
    </div>

    <section v-if="faqs.length > 0" class="mx-auto max-w-[1240px] px-6 pb-24 lg:px-10 lg:pb-32" aria-labelledby="faq-title">
      <div class="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
        <div>
          <p class="home-eyebrow">FAQ</p>
          <h2 id="faq-title" class="home-display mt-4 max-w-[440px] text-[clamp(2.5rem,4vw,4.2rem)] font-semibold leading-[0.98] tracking-[-0.055em]">Masih ada yang <span class="home-serif font-normal italic text-[#315bd6] dark:text-[#9eb6ff]">ganjel?</span></h2>
        </div>
        <div class="space-y-3">
          <details v-for="faq in faqs" :key="faq.id" class="group rounded-[1.5rem] border border-[#e0dcd4] bg-white px-5 py-5 dark:border-white/10 dark:bg-[#15181e]">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-5 text-[15px] font-bold marker:hidden sm:text-[16px]">
              {{ faq.question }}
              <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f0eb] text-lg transition-transform group-open:rotate-45 dark:bg-white/[0.07]">+</span>
            </summary>
            <p class="max-w-2xl pt-4 text-sm leading-7 text-[#717781] dark:text-[#9da3ad]">{{ faq.answer }}</p>
          </details>
        </div>
      </div>
    </section>

    <section class="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
      <div class="mx-auto max-w-[1300px] overflow-hidden rounded-[2.8rem] bg-[#315bd6] px-6 py-14 text-white sm:px-10 lg:px-16 lg:py-18">
        <div class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <h2 class="home-display max-w-[760px] text-[clamp(3rem,6vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.06em]">Kalau bingung mulai dari mana, <span class="home-serif font-normal italic text-[#ffd1c4]">mulai dari cerita aja.</span></h2>
          <div class="lg:justify-self-end">
            <p class="max-w-sm text-[15px] leading-7 text-white/75">Konsultasi awal untuk bantu lihat masalah, scope, dan kemungkinan solusi yang paling masuk akal.</p>
            <a :href="consultLink" target="_blank" rel="noreferrer" class="mt-6 inline-flex min-h-14 items-center gap-5 rounded-full bg-white px-7 text-sm font-bold text-[#213b91] transition-transform hover:-translate-y-0.5">Mulai ngobrol <span>↗</span></a>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  font-family: 'Plus Jakarta Sans', 'DM Sans', sans-serif;
}

.home-display {
  font-family: 'Plus Jakarta Sans', 'DM Sans', sans-serif;
}

.home-serif {
  font-family: 'Instrument Serif', Georgia, serif;
}

.home-eyebrow {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #ff704d;
}

.hero-splotch {
  position: absolute;
  border-radius: 999px;
  filter: blur(0px);
  pointer-events: none;
}

.hero-splotch-one {
  top: 6rem;
  left: -7rem;
  width: 17rem;
  height: 17rem;
  background: #ece9ff;
}

.hero-splotch-two {
  right: 27%;
  bottom: 5rem;
  width: 8rem;
  height: 8rem;
  background: #ffe0d7;
}

.dark .hero-splotch-one {
  background: #171a2c;
}

.dark .hero-splotch-two {
  background: #2c1e1b;
}

@media (max-width: 640px) {
  .hero-splotch-one {
    width: 12rem;
    height: 12rem;
    left: -6rem;
  }

  .hero-splotch-two {
    right: -2rem;
    bottom: 46%;
  }
}
</style>
