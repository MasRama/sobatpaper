<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { formatIDR } from '../../../services/web';
import { createUsersClient } from '../../../users/web';
import type { Attachment } from '../../../attachments/web';
import type { OrderDetail, OrderEvent, OrderFinalFile, OrderPayment, OrderStatus } from '../../contract';
import { DOCUMENT_CONDITION_LABELS, ORDER_STATUS_LABELS, ORDER_TRANSITIONS } from '../../contract';
import { createOrdersClient } from '../client';

const route = useRoute();
const client = createOrdersClient();
const usersClient = createUsersClient();

const order = ref<OrderDetail | null>(null);
const attachments = ref<Attachment[]>([]);
const events = ref<OrderEvent[]>([]);
const payments = ref<OrderPayment[]>([]);
const finalFiles = ref<OrderFinalFile[]>([]);
const picOptions = ref<Array<{ id: string; name: string }>>([]);
const isLoading = ref(true);
const errorMessage = ref('');
const formMessage = ref('');
const formError = ref('');
const isSaving = ref(false);
const isSavingPayment = ref(false);
const isUploadingFinal = ref(false);
const paymentForm = ref({ amount: '', method: 'transfer', reference: '' });
const paymentMessage = ref('');
const paymentError = ref('');
const finalFileMessage = ref('');
const finalFileError = ref('');

const form = ref({ status: '' as '' | OrderStatus, finalPrice: '', picUserId: '', cancelReason: '' });

const nextStatuses = computed<OrderStatus[]>(() => {
  if (!order.value) return [];
  return [order.value.status, ...ORDER_TRANSITIONS[order.value.status]];
});

function formatDateTime(value: number): string {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

async function load(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const id = String(route.params.id ?? '');
    const response = await client.detail(id);
    if (!response.success) {
      errorMessage.value = response.message;
      return;
    }
    order.value = response.data.order;
    attachments.value = response.data.attachments;
    events.value = response.data.events;
    payments.value = response.data.payments;
    finalFiles.value = response.data.finalFiles;
    form.value = {
      status: response.data.order.status,
      finalPrice: response.data.order.finalPrice === null ? '' : String(response.data.order.finalPrice),
      picUserId: response.data.order.picUserId ?? '',
      cancelReason: '',
    };
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat order';
  } finally {
    isLoading.value = false;
  }
}

async function addPayment(): Promise<void> {
  if (!order.value || isSavingPayment.value) return;
  paymentMessage.value = '';
  paymentError.value = '';
  const amount = Number(paymentForm.value.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    paymentError.value = 'Nominal pembayaran wajib lebih dari 0.';
    return;
  }
  isSavingPayment.value = true;
  try {
    const response = await client.createPayment(order.value.id, {
      amount,
      method: paymentForm.value.method,
      reference: paymentForm.value.reference.trim() || null,
    });
    if (!response.success) {
      paymentError.value = response.message;
      return;
    }
    paymentForm.value = { amount: '', method: 'transfer', reference: '' };
    paymentMessage.value = 'Pembayaran tercatat.';
    await load();
  } catch (error) {
    paymentError.value = error instanceof Error ? error.message : 'Gagal mencatat pembayaran';
  } finally {
    isSavingPayment.value = false;
  }
}

async function removePayment(paymentId: string): Promise<void> {
  if (!order.value) return;
  const response = await client.deletePayment(order.value.id, paymentId);
  if (!response.success) {
    paymentError.value = response.message;
    return;
  }
  paymentMessage.value = 'Pembayaran dihapus.';
  await load();
}

async function uploadFinalFile(event: Event): Promise<void> {
  if (!order.value || isUploadingFinal.value) return;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  finalFileMessage.value = '';
  finalFileError.value = '';
  isUploadingFinal.value = true;
  try {
    const response = await client.uploadFinalFile(order.value.id, file);
    if (!response.success) {
      finalFileError.value = response.message;
      return;
    }
    finalFileMessage.value = 'File final berhasil diunggah.';
    input.value = '';
    await load();
  } catch (error) {
    finalFileError.value = error instanceof Error ? error.message : 'Gagal mengunggah file final';
  } finally {
    isUploadingFinal.value = false;
  }
}

async function removeFinalFile(fileId: string): Promise<void> {
  if (!order.value) return;
  const response = await client.deleteFinalFile(order.value.id, fileId);
  if (!response.success) {
    finalFileError.value = response.message;
    return;
  }
  finalFileMessage.value = 'File final dihapus.';
  await load();
}

async function loadPicOptions(): Promise<void> {
  try {
    const response = await usersClient.listUsers({ limit: 100 });
    if (response.success) {
      picOptions.value = response.data.users.map((user) => ({ id: user.id, name: user.name }));
    }
  } catch {
    picOptions.value = [];
  }
}

async function save(): Promise<void> {
  if (!order.value || isSaving.value) return;
  isSaving.value = true;
  formMessage.value = '';
  formError.value = '';
  try {
    const patch: { status?: OrderStatus; finalPrice?: number | null; picUserId?: string | null; cancelReason?: string } = {};
    if (form.value.status && form.value.status !== order.value.status) patch.status = form.value.status;
    const price = form.value.finalPrice.trim();
    const currentPrice = order.value.finalPrice === null ? '' : String(order.value.finalPrice);
    if (price !== currentPrice) patch.finalPrice = price === '' ? null : Number(price);
    const pic = form.value.picUserId.trim();
    if (pic !== (order.value.picUserId ?? '')) patch.picUserId = pic === '' ? null : pic;
    if (form.value.status === 'cancelled' && form.value.cancelReason.trim()) {
      patch.cancelReason = form.value.cancelReason.trim();
    }
    if (Object.keys(patch).length === 0) {
      formError.value = 'Tidak ada perubahan untuk disimpan.';
      return;
    }
    const response = await client.update(order.value.id, patch);
    if (!response.success) {
      formError.value = response.message;
      return;
    }
    formMessage.value = 'Order berhasil diperbarui.';
    await load();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Gagal menyimpan perubahan';
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  void load();
  void loadPicOptions();
});
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10 lg:px-8">
    <RouterLink to="/admin/orders" class="text-sm font-semibold text-primary hover:underline">← Kembali ke daftar order</RouterLink>
    <p v-if="isLoading" class="mt-6 text-sm text-muted-foreground">Memuat order…</p>
    <p v-else-if="errorMessage" role="alert" class="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      {{ errorMessage }}
    </p>
    <template v-else-if="order">
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <h1 class="font-heading text-3xl font-semibold tracking-tight">{{ order.number }}</h1>
        <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {{ ORDER_STATUS_LABELS[order.status] }}
        </span>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <section class="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2" aria-label="Detail order">
          <h2 class="font-heading text-base font-semibold">Detail kebutuhan</h2>
          <dl class="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div><dt class="text-muted-foreground">Layanan</dt><dd class="font-medium">{{ order.serviceSlug }}</dd></div>
            <div><dt class="text-muted-foreground">Paket</dt><dd class="font-medium">{{ order.packageName ?? '—' }}</dd></div>
            <div><dt class="text-muted-foreground">Jenjang</dt><dd class="font-medium">{{ order.educationLevel }}</dd></div>
            <div><dt class="text-muted-foreground">Bidang</dt><dd class="font-medium">{{ order.field }}</dd></div>
            <div><dt class="text-muted-foreground">Institusi</dt><dd class="font-medium">{{ order.institution }}</dd></div>
            <div><dt class="text-muted-foreground">Metode</dt><dd class="font-medium">{{ order.method }}</dd></div>
            <div><dt class="text-muted-foreground">Halaman</dt><dd class="font-medium">{{ order.pages }}</dd></div>
            <div>
              <dt class="text-muted-foreground">Kondisi dokumen</dt>
              <dd class="font-medium">{{ DOCUMENT_CONDITION_LABELS[order.documentCondition as keyof typeof DOCUMENT_CONDITION_LABELS] ?? order.documentCondition }}</dd>
            </div>
            <div><dt class="text-muted-foreground">Deadline</dt><dd class="font-medium">{{ order.deadline }}</dd></div>
            <div><dt class="text-muted-foreground">Kontak</dt><dd class="font-medium">{{ order.contactName }} · {{ order.contactWhatsapp }}</dd></div>
            <div class="sm:col-span-2"><dt class="text-muted-foreground">Topik</dt><dd class="font-medium">{{ order.topic }}</dd></div>
            <div v-if="order.specialNeeds" class="sm:col-span-2">
              <dt class="text-muted-foreground">Kebutuhan khusus</dt><dd class="font-medium">{{ order.specialNeeds }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Estimasi</dt>
              <dd class="font-medium">
                {{ order.estimateMin === null || order.estimateMax === null ? '—' : `${formatIDR(order.estimateMin)} – ${formatIDR(order.estimateMax)}` }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Harga final</dt>
              <dd class="font-medium">{{ order.finalPrice === null ? '—' : formatIDR(order.finalPrice) }}</dd>
            </div>
            <div v-if="order.cancelReason" class="sm:col-span-2">
              <dt class="text-muted-foreground">Alasan batal</dt><dd class="font-medium">{{ order.cancelReason }}</dd>
            </div>
          </dl>

          <h2 class="mt-8 font-heading text-base font-semibold">Dokumen customer ({{ attachments.length }})</h2>
          <ul v-if="attachments.length > 0" class="mt-3 space-y-2 text-sm">
            <li v-for="file in attachments" :key="file.id" class="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <span class="truncate">{{ file.name }} <span class="text-muted-foreground">({{ file.size }} byte)</span></span>
              <a :href="`/api/attachments/${file.id}`" class="shrink-0 font-semibold text-primary hover:underline" download>
                Unduh
              </a>
            </li>
          </ul>
          <p v-else class="mt-3 text-sm text-muted-foreground">Tidak ada dokumen terlampir.</p>

          <h2 class="mt-8 font-heading text-base font-semibold">Pembayaran</h2>
          <form class="mt-3 grid gap-3 sm:grid-cols-3" @submit.prevent="addPayment">
            <input v-model="paymentForm.amount" type="number" min="1" step="1000" placeholder="Nominal" class="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input v-model="paymentForm.method" type="text" placeholder="Metode" class="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input v-model="paymentForm.reference" type="text" placeholder="Referensi (opsional)" class="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" :disabled="isSavingPayment" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:col-span-3 disabled:opacity-60">
              {{ isSavingPayment ? 'Menyimpan…' : 'Catat pembayaran' }}
            </button>
          </form>
          <p v-if="paymentMessage" class="mt-3 text-sm text-primary">{{ paymentMessage }}</p>
          <p v-if="paymentError" role="alert" class="mt-3 text-sm text-destructive">{{ paymentError }}</p>
          <ul v-if="payments.length" class="mt-3 space-y-2 text-sm">
            <li v-for="payment in payments" :key="payment.id" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div>
                <span class="font-medium">{{ formatIDR(payment.amount) }}</span>
                <span class="text-muted-foreground"> · {{ payment.method }} · {{ formatDateTime(payment.paidAt) }}</span>
                <span v-if="payment.reference" class="block text-muted-foreground">Ref: {{ payment.reference }}</span>
              </div>
              <button type="button" class="text-xs font-semibold text-destructive hover:underline" @click="removePayment(payment.id)">Hapus</button>
            </li>
          </ul>
          <p v-else class="mt-3 text-sm text-muted-foreground">Belum ada pembayaran tercatat.</p>

          <h2 class="mt-8 font-heading text-base font-semibold">File final</h2>
          <input type="file" accept=".pdf,.doc,.docx,.xlsx,.csv,.pptx,.zip" class="mt-3 block w-full text-sm" :disabled="isUploadingFinal" @change="uploadFinalFile" />
          <p v-if="finalFileMessage" class="mt-3 text-sm text-primary">{{ finalFileMessage }}</p>
          <p v-if="finalFileError" role="alert" class="mt-3 text-sm text-destructive">{{ finalFileError }}</p>
          <ul v-if="finalFiles.length" class="mt-3 space-y-2 text-sm">
            <li v-for="file in finalFiles" :key="file.id" class="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div class="min-w-0">
                <span class="block truncate font-medium">{{ file.name }}</span>
                <span class="text-muted-foreground">{{ file.size }} byte · {{ formatDateTime(file.createdAt) }}</span>
              </div>
              <div class="flex shrink-0 items-center gap-3">
                <a :href="`/api/orders/${order.id}/final-files/${file.id}`" download class="font-semibold text-primary hover:underline">Unduh</a>
                <button type="button" class="text-xs font-semibold text-destructive hover:underline" @click="removeFinalFile(file.id)">Hapus</button>
              </div>
            </li>
          </ul>
          <p v-else class="mt-3 text-sm text-muted-foreground">Belum ada file final.</p>

          <h2 class="mt-8 font-heading text-base font-semibold">Riwayat perubahan ({{ events.length }})</h2>
          <ol v-if="events.length > 0" class="mt-3 space-y-2 text-sm">
            <li v-for="event in events" :key="event.id" class="rounded-lg border border-border px-3 py-2">
              <span class="font-medium">{{ event.kind === 'status' ? 'Status' : 'Harga final' }}</span>
              {{ event.fromValue ?? '—' }} → {{ event.toValue ?? '—' }}
              <span class="text-muted-foreground">oleh {{ event.actorName ?? 'sistem' }} · {{ formatDateTime(event.createdAt) }}</span>
              <span v-if="event.note" class="block text-muted-foreground">{{ event.note }}</span>
            </li>
          </ol>
          <p v-else class="mt-3 text-sm text-muted-foreground">Belum ada perubahan tercatat.</p>
        </section>

        <section class="rounded-2xl border border-border bg-card p-6 shadow-soft" aria-label="Kelola order">
          <h2 class="font-heading text-base font-semibold">Kelola order</h2>
          <form class="mt-4 space-y-4" @submit.prevent="save">
            <div>
              <label for="order-status" class="text-sm font-medium">Status</label>
              <select id="order-status" v-model="form.status" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option v-for="status in nextStatuses" :key="status" :value="status">
                  {{ ORDER_STATUS_LABELS[status] }}
                </option>
              </select>
            </div>
            <div v-if="form.status === 'cancelled'">
              <label for="cancel-reason" class="text-sm font-medium">Alasan pembatalan</label>
              <textarea
                id="cancel-reason"
                v-model="form.cancelReason"
                rows="2"
                class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Wajib diisi saat membatalkan"
              />
            </div>
            <div>
              <label for="final-price" class="text-sm font-medium">Harga final (Rp)</label>
              <input
                id="final-price"
                v-model="form.finalPrice"
                type="number"
                min="0"
                step="1000"
                class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Kosongkan bila belum ditetapkan"
              />
            </div>
            <div>
              <label for="pic" class="text-sm font-medium">PIC</label>
              <select v-if="picOptions.length > 0" id="pic" v-model="form.picUserId" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="">Belum ditetapkan</option>
                <option v-for="pic in picOptions" :key="pic.id" :value="pic.id">{{ pic.name }}</option>
              </select>
              <input
                v-else
                id="pic"
                v-model="form.picUserId"
                type="text"
                class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="ID user PIC"
              />
            </div>
            <p v-if="formMessage" role="status" class="rounded-lg bg-primary/10 p-3 text-sm text-primary">{{ formMessage }}</p>
            <p v-if="formError" role="alert" class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">{{ formError }}</p>
            <button
              type="submit"
              :disabled="isSaving"
              class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {{ isSaving ? 'Menyimpan…' : 'Simpan perubahan' }}
            </button>
          </form>
        </section>
      </div>
    </template>
  </main>
</template>
