<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { formatIDR } from '../../../services/web';
import type { AdminOrdersQuery, OrderDetail } from '../../contract';
import { ORDER_SERVICES, ORDER_STATUS_LABELS, ORDER_STATUSES } from '../../contract';
import { createOrdersClient } from '../client';

const client = createOrdersClient();
const route = useRoute();

const orders = ref<OrderDetail[]>([]);
const total = ref(0);
const isLoading = ref(true);
const errorMessage = ref('');
const filters = ref({ status: '', serviceSlug: '', search: '' });
const offset = ref(0);
const limit = 20;

async function load(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await client.list({
      status: (filters.value.status || undefined) as OrderDetail['status'] | undefined,
      serviceSlug: (filters.value.serviceSlug || undefined) as AdminOrdersQuery['serviceSlug'],
      search: filters.value.search || undefined,
      limit,
      offset: offset.value,
    });
    if (!response.success) {
      errorMessage.value = response.message;
      orders.value = [];
      total.value = 0;
      return;
    }
    orders.value = response.data.orders;
    total.value = response.data.total;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat order';
  } finally {
    isLoading.value = false;
  }
}

function applyFilters(): void {
  offset.value = 0;
  void load();
}

function prevPage(): void {
  offset.value = Math.max(0, offset.value - limit);
  void load();
}

function nextPage(): void {
  if (offset.value + limit < total.value) {
    offset.value += limit;
    void load();
  }
}

onMounted(() => {
  const query = route.query;
  if (typeof query.status === 'string') filters.value.status = query.status;
  if (typeof query.serviceSlug === 'string') filters.value.serviceSlug = query.serviceSlug;
  if (typeof query.search === 'string') filters.value.search = query.search;
  void load();
});
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10 lg:px-8">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Admin</p>
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight">Order</h1>
    <p class="mt-3 text-sm text-muted-foreground">{{ total }} order tercatat.</p>

    <form class="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row" @submit.prevent="applyFilters">
      <select v-model="filters.status" class="rounded-lg border border-border bg-background px-3 py-2 text-sm" aria-label="Filter status">
        <option value="">Semua status</option>
        <option v-for="status in ORDER_STATUSES" :key="status" :value="status">
          {{ ORDER_STATUS_LABELS[status] }}
        </option>
      </select>
      <select v-model="filters.serviceSlug" class="rounded-lg border border-border bg-background px-3 py-2 text-sm" aria-label="Filter layanan">
        <option value="">Semua layanan</option>
        <option v-for="service in ORDER_SERVICES" :key="service" :value="service">{{ service }}</option>
      </select>
      <input
        v-model="filters.search"
        type="search"
        placeholder="Cari nomor, nama, topik…"
        class="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <button type="submit" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        Filter
      </button>
    </form>

    <p v-if="isLoading" class="mt-6 text-sm text-muted-foreground">Memuat order…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      {{ errorMessage }}
    </p>
    <p v-else-if="orders.length === 0" class="mt-6 text-sm text-muted-foreground">Belum ada order yang cocok.</p>

    <div v-else class="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr class="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th class="px-4 py-3">Nomor</th>
            <th class="px-4 py-3">Layanan</th>
            <th class="px-4 py-3">Kontak</th>
            <th class="px-4 py-3">Deadline</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Harga Final</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id" class="border-b border-border last:border-0 hover:bg-muted/40">
            <td class="px-4 py-3">
              <RouterLink :to="`/admin/orders/${order.id}`" class="font-semibold text-primary hover:underline">
                {{ order.number }}
              </RouterLink>
            </td>
            <td class="px-4 py-3">{{ order.serviceSlug }}</td>
            <td class="px-4 py-3">{{ order.contactName }}</td>
            <td class="px-4 py-3">{{ order.deadline }}</td>
            <td class="px-4 py-3">{{ ORDER_STATUS_LABELS[order.status] }}</td>
            <td class="px-4 py-3">{{ order.finalPrice === null ? '—' : formatIDR(order.finalPrice) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex items-center gap-3 text-sm">
      <button
        type="button"
        :disabled="offset === 0"
        class="rounded-lg border border-border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        @click="prevPage"
      >
        Sebelumnya
      </button>
      <button
        type="button"
        :disabled="offset + limit >= total"
        class="rounded-lg border border-border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        @click="nextPage"
      >
        Berikutnya
      </button>
    </div>
  </main>
</template>
