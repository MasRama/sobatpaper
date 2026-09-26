<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthSession } from '../../features/auth/web';
import { createLeadsClient } from '../../features/leads/web';
import { createOrdersClient } from '../../features/orders/web';

const authSession = useAuthSession();
const user = authSession.user;

const ordersClient = createOrdersClient();
const leadsClient = createLeadsClient();

const stats = ref({ totalOrders: '—', newLeads: '—', awaitingPayment: '—', inRevision: '—' });
const isLoading = ref(true);

async function load(): Promise<void> {
  isLoading.value = true;
  try {
    const [all, leads, payment, revision] = await Promise.all([
      ordersClient.list({ limit: 1 }),
      leadsClient.list({ status: 'baru', limit: 1 }),
      ordersClient.list({ status: 'menunggu_pembayaran', limit: 1 }),
      ordersClient.list({ status: 'revisi', limit: 1 }),
    ]);
    if (all.success) stats.value.totalOrders = String(all.data.total);
    if (leads.success) stats.value.newLeads = String(leads.data.total);
    if (payment.success) stats.value.awaitingPayment = String(payment.data.total);
    if (revision.success) stats.value.inRevision = String(revision.data.total);
  } catch {
    // Keep placeholders when the API is unreachable.
  } finally {
    isLoading.value = false;
  }
}

const CARDS = [
  { label: 'Total Order', key: 'totalOrders', to: '/admin/orders' },
  { label: 'Leads Baru', key: 'newLeads', to: '/admin/leads' },
  { label: 'Menunggu Pembayaran', key: 'awaitingPayment', to: '/admin/orders?status=menunggu_pembayaran' },
  { label: 'Revisi Berjalan', key: 'inRevision', to: '/admin/orders?status=revisi' },
] as const;

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10 lg:px-8">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Admin</p>
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight">Dasbor Admin</h1>
    <p class="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
      Selamat datang, {{ user?.name }}. Ringkasan operasional SobatPaper per {{ isLoading ? '…' : 'saat ini' }}.
    </p>

    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <RouterLink
        v-for="card in CARDS"
        :key="card.label"
        :to="card.to"
        class="rounded-2xl border border-border bg-card p-6 shadow-soft transition-colors hover:border-primary/40"
      >
        <p class="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">{{ card.label }}</p>
        <p class="mt-4 font-heading text-3xl font-semibold tracking-tight">
          {{ stats[card.key] }}
        </p>
      </RouterLink>
    </div>

    <nav class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Modul admin">
      <RouterLink
        v-for="item in [
          { label: 'Kelola Order', desc: 'Status, harga final, PIC, dokumen.', to: '/admin/orders' },
          { label: 'Kelola Leads', desc: 'Follow-up dan konversi ke order.', to: '/admin/leads' },
          { label: 'Kelola Layanan', desc: 'Katalog, scope, proses, FAQ.', to: '/admin/layanan' },
          { label: 'Kelola Harga', desc: 'Paket dinamis tanpa deploy.', to: '/admin/harga' },
          { label: 'Portofolio & Testimonial', desc: 'Bukti kerja dan ulasan.', to: '/admin/portofolio' },
          { label: 'Konten & Pengaturan', desc: 'Halaman, FAQ, nomor WA.', to: '/admin/konten' },
        ]"
        :key="item.label"
        :to="item.to"
        class="rounded-2xl border border-border bg-card p-6 shadow-soft transition-colors hover:border-primary/40"
      >
        <p class="font-heading text-base font-semibold">{{ item.label }}</p>
        <p class="mt-1 text-sm text-muted-foreground">{{ item.desc }}</p>
      </RouterLink>
    </nav>
  </main>
</template>
