<script setup lang="ts">
import { useAuthSession } from '../../features/auth/web';

const authSession = useAuthSession();
const user = authSession.user;
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-10 lg:px-8">
    <p class="font-heading text-xs uppercase tracking-[0.25em] text-primary">Admin</p>
    <h1 class="mt-3 font-heading text-3xl font-semibold tracking-tight">Dasbor Admin</h1>
    <p class="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
      Selamat datang, {{ user?.name }}. Modul operasional (order, layanan, harga, leads) menyusul di M3.
    </p>

    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article v-for="label in ['Order Aktif', 'Leads Baru', 'Menunggu Pembayaran', 'Revisi Berjalan']" :key="label" class="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <p class="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">{{ label }}</p>
        <p class="mt-4 font-heading text-3xl font-semibold tracking-tight text-muted-foreground">—</p>
      </article>
    </div>
  </main>
</template>
