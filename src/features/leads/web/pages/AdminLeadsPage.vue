<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  DOCUMENT_CONDITIONS,
  ORDER_SERVICES,
  type CreateOrderInput,
} from '../../../orders/web';
import type { Lead } from '../../contract';
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from '../../contract';
import { createLeadsClient } from '../client';

const client = createLeadsClient();

const leads = ref<Lead[]>([]);
const total = ref(0);
const selected = ref<Lead | null>(null);
const isLoading = ref(true);
const errorMessage = ref('');
const filters = ref({ status: '', search: '' });

const followUp = ref({ status: 'dihubungi', notes: '' });
const followUpMessage = ref('');
const followUpError = ref('');

const showConvert = ref(false);
const convertMessage = ref('');
const convertError = ref('');
const isConverting = ref(false);
const orderForm = ref<{
  serviceSlug: string;
  educationLevel: string;
  field: string;
  institution: string;
  topic: string;
  method: string;
  pages: number;
  documentCondition: string;
  deadline: string;
  contactName: string;
  contactWhatsapp: string;
}>({
  serviceSlug: ORDER_SERVICES[0] ?? 'skripsi',
  educationLevel: 'S1',
  field: '',
  institution: '',
  topic: '',
  method: '',
  pages: 0,
  documentCondition: DOCUMENT_CONDITIONS[0] ?? 'draf',
  deadline: '',
  contactName: '',
  contactWhatsapp: '',
});

function validServiceSlug(value: string | null): CreateOrderInput['serviceSlug'] {
  const fallback = ORDER_SERVICES[0] ?? 'skripsi';
  if (!value) return fallback;
  return (ORDER_SERVICES as readonly string[]).includes(value) ? (value as CreateOrderInput['serviceSlug']) : fallback;
}

async function load(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await client.list({
      status: (filters.value.status || undefined) as Lead['status'] | undefined,
      search: filters.value.search || undefined,
      limit: 50,
      offset: 0,
    });
    if (!response.success) {
      errorMessage.value = response.message;
      leads.value = [];
      total.value = 0;
      return;
    }
    leads.value = response.data.leads;
    total.value = response.data.total;
    if (selected.value) {
      selected.value = leads.value.find((lead) => lead.id === selected.value?.id) ?? null;
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat leads';
  } finally {
    isLoading.value = false;
  }
}

function select(lead: Lead): void {
  selected.value = lead;
  followUp.value = { status: 'dihubungi', notes: lead.notes ?? '' };
  followUpMessage.value = '';
  followUpError.value = '';
  showConvert.value = false;
  convertMessage.value = '';
  convertError.value = '';
  orderForm.value = {
    serviceSlug: validServiceSlug(lead.serviceSlug),
    educationLevel: 'S1',
    field: '',
    institution: '',
    topic: '',
    method: '',
    pages: 0,
    documentCondition: DOCUMENT_CONDITIONS[0] ?? 'draf',
    deadline: '',
    contactName: lead.name,
    contactWhatsapp: lead.whatsapp.replace(/^\+/, ''),
  };
}

async function saveFollowUp(): Promise<void> {
  if (!selected.value) return;
  followUpMessage.value = '';
  followUpError.value = '';
  const response = await client.update(selected.value.id, {
    status: followUp.value.status as 'baru' | 'dihubungi' | 'qualified' | 'cold',
    notes: followUp.value.notes || null,
  });
  if (!response.success) {
    followUpError.value = response.message;
    return;
  }
  followUpMessage.value = 'Follow-up tersimpan.';
  await load();
}

async function convert(): Promise<void> {
  if (!selected.value || isConverting.value) return;
  isConverting.value = true;
  convertMessage.value = '';
  convertError.value = '';
  try {
    const payload: CreateOrderInput = {
      serviceSlug: validServiceSlug(orderForm.value.serviceSlug),
      educationLevel: orderForm.value.educationLevel as CreateOrderInput['educationLevel'],
      field: orderForm.value.field,
      institution: orderForm.value.institution,
      topic: orderForm.value.topic,
      method: orderForm.value.method,
      pages: Number(orderForm.value.pages),
      documentCondition: orderForm.value.documentCondition as CreateOrderInput['documentCondition'],
      deadline: orderForm.value.deadline,
      contactName: orderForm.value.contactName,
      contactWhatsapp: orderForm.value.contactWhatsapp,
      attachmentIds: [],
    };
    const response = await client.convert(selected.value.id, payload);
    if (!response.success) {
      convertError.value = response.message;
      return;
    }
    convertMessage.value = `Lead dikonversi menjadi order ${response.data.order.number}.`;
    await load();
  } catch (error) {
    convertError.value = error instanceof Error ? error.message : 'Gagal mengonversi lead';
  } finally {
    isConverting.value = false;
  }
}

onMounted(() => {
  void load();
});
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10 lg:px-8">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Admin</p>
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight">Leads</h1>
    <p class="mt-3 text-sm text-muted-foreground">{{ total }} lead tercatat.</p>

    <form class="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row" @submit.prevent="load">
      <select v-model="filters.status" class="rounded-lg border border-border bg-background px-3 py-2 text-sm" aria-label="Filter status">
        <option value="">Semua status</option>
        <option v-for="status in LEAD_STATUSES" :key="status" :value="status">
          {{ LEAD_STATUS_LABELS[status] }}
        </option>
      </select>
      <input
        v-model="filters.search"
        type="search"
        placeholder="Cari nama, WA, kebutuhan…"
        class="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <button type="submit" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        Filter
      </button>
    </form>

    <p v-if="isLoading" class="mt-6 text-sm text-muted-foreground">Memuat leads…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      {{ errorMessage }}
    </p>
    <div v-else class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table class="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr class="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th class="px-4 py-3">Nama</th>
              <th class="px-4 py-3">Layanan</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="lead in leads"
              :key="lead.id"
              class="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
              :class="selected?.id === lead.id ? 'bg-muted/40' : ''"
              @click="select(lead)"
            >
              <td class="px-4 py-3 font-medium">{{ lead.name }}</td>
              <td class="px-4 py-3">{{ lead.serviceSlug ?? '—' }}</td>
              <td class="px-4 py-3">{{ LEAD_STATUS_LABELS[lead.status] }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section v-if="selected" class="rounded-2xl border border-border bg-card p-6 shadow-soft" aria-label="Detail lead">
        <h2 class="font-heading text-base font-semibold">{{ selected.name }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ selected.whatsapp }} · {{ LEAD_STATUS_LABELS[selected.status] }}</p>
        <p class="mt-3 text-sm leading-relaxed">{{ selected.need }}</p>
        <p v-if="selected.convertedOrderId" class="mt-3 text-sm">
          Order:
          <RouterLink :to="`/admin/orders/${selected.convertedOrderId}`" class="font-semibold text-primary hover:underline">
            Lihat order hasil konversi
          </RouterLink>
        </p>

        <form v-if="selected.status !== 'converted'" class="mt-6 space-y-3 border-t border-border pt-4" @submit.prevent="saveFollowUp">
          <h3 class="font-heading text-sm font-semibold">Follow-up</h3>
          <div class="flex gap-3">
            <select v-model="followUp.status" class="rounded-lg border border-border bg-background px-3 py-2 text-sm" aria-label="Status follow-up">
              <option value="baru">Baru</option>
              <option value="dihubungi">Dihubungi</option>
              <option value="qualified">Qualified</option>
              <option value="cold">Cold</option>
            </select>
            <input v-model="followUp.notes" type="text" placeholder="Catatan…" class="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <p v-if="followUpMessage" role="status" class="text-sm text-primary">{{ followUpMessage }}</p>
          <p v-if="followUpError" role="alert" class="text-sm text-destructive">{{ followUpError }}</p>
          <button type="submit" class="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Simpan follow-up</button>
        </form>

        <div v-if="selected.status !== 'converted'" class="mt-6 border-t border-border pt-4">
          <button type="button" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" @click="showConvert = !showConvert">
            {{ showConvert ? 'Tutup form konversi' : 'Konversi menjadi order' }}
          </button>
          <form v-if="showConvert" class="mt-4 grid gap-3 text-sm sm:grid-cols-2" @submit.prevent="convert">
            <label class="block">Layanan
              <select v-model="orderForm.serviceSlug" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2">
                <option v-for="service in ORDER_SERVICES" :key="service" :value="service">{{ service }}</option>
              </select>
            </label>
            <label class="block">Jenjang
              <select v-model="orderForm.educationLevel" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2">
                <option>S1</option><option>S2</option><option>S3</option><option>lainnya</option>
              </select>
            </label>
            <label class="block">Bidang/Jurusan
              <input v-model="orderForm.field" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label class="block">Institusi
              <input v-model="orderForm.institution" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label class="block sm:col-span-2">Topik
              <input v-model="orderForm.topic" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label class="block">Metode
              <input v-model="orderForm.method" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label class="block">Halaman
              <input v-model.number="orderForm.pages" type="number" min="0" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label class="block">Kondisi dokumen
              <select v-model="orderForm.documentCondition" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2">
                <option v-for="condition in DOCUMENT_CONDITIONS" :key="condition" :value="condition">{{ condition }}</option>
              </select>
            </label>
            <label class="block">Deadline
              <input v-model="orderForm.deadline" type="date" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label class="block">Nama kontak
              <input v-model="orderForm.contactName" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label class="block">WA kontak
              <input v-model="orderForm.contactWhatsapp" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <p v-if="convertMessage" role="status" class="sm:col-span-2 text-sm text-primary">{{ convertMessage }}</p>
            <p v-if="convertError" role="alert" class="sm:col-span-2 text-sm text-destructive">{{ convertError }}</p>
            <div class="sm:col-span-2">
              <button type="submit" :disabled="isConverting" class="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">
                {{ isConverting ? 'Mengonversi…' : 'Buat order dari lead' }}
              </button>
            </div>
          </form>
        </div>
      </section>
      <p v-else class="text-sm text-muted-foreground">Pilih lead untuk melihat detail.</p>
    </div>
  </main>
</template>
