import type { QuoteInput, QuoteResult } from '../contract';

const SERVICE_BASE: Record<string, number> = {
  skripsi: 3_000_000,
  tesis: 3_500_000,
  'analisis-data': 500_000,
  'editing-formatting': 300_000,
};

const KONVERSI_BASE: Record<string, number> = {
  'SINTA 6': 500_000,
  'SINTA 5': 750_000,
  'SINTA 4': 1_000_000,
  'SINTA 3': 1_500_000,
};

const ARTIKEL_BASE: Record<string, number> = {
  'SINTA 6': 1_500_000,
  'SINTA 5': 2_000_000,
  'SINTA 4': 3_000_000,
  'SINTA 3': 5_000_000,
};

function round50k(amount: number): number {
  return Math.round(amount / 50_000) * 50_000;
}

function pageAdjustment(pages: number): { amount: number; label: string } | undefined {
  if (pages > 200) return { amount: 750_000, label: 'Naskah di atas 200 halaman' };
  if (pages > 100) return { amount: 500_000, label: 'Naskah 101–200 halaman' };
  if (pages > 50) return { amount: 250_000, label: 'Naskah 51–100 halaman' };
  return undefined;
}

function dataAdjustment(dataCount: number): { amount: number; label: string } | undefined {
  if (dataCount > 2000) return { amount: 500_000, label: 'Data di atas 2000 responden/baris' };
  if (dataCount > 500) return { amount: 300_000, label: 'Data 501–2000 responden/baris' };
  if (dataCount > 100) return { amount: 150_000, label: 'Data 101–500 responden/baris' };
  return undefined;
}

function daysUntil(deadline: string, now: Date): number {
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = new Date(`${deadline}T00:00:00Z`).getTime();
  return Math.floor((target - startOfToday) / 86_400_000);
}

/**
 * Deterministic estimate: identical input always yields the identical range.
 * `now` is injectable so rush tiers are testable without wall-clock flakiness.
 */
export function quoteEstimation(input: QuoteInput, now: Date = new Date()): QuoteResult {
  let base = SERVICE_BASE[input.serviceSlug] ?? 0;
  if (input.serviceSlug === 'konversi-jurnal') base = KONVERSI_BASE[input.journalTarget ?? ''] ?? 0;
  if (input.serviceSlug === 'artikel-ilmiah') base = ARTIKEL_BASE[input.journalTarget ?? ''] ?? 0;

  const factors: string[] = [`Harga dasar layanan ${input.serviceSlug}`];
  let total = base;

  const pages = pageAdjustment(input.pages);
  if (pages && input.serviceSlug !== 'analisis-data') {
    total += pages.amount;
    factors.push(`${pages.label} (+Rp${pages.amount.toLocaleString('id-ID')})`);
  }
  const data = dataAdjustment(input.dataCount);
  if (data && (input.serviceSlug === 'analisis-data' || input.serviceSlug === 'skripsi' || input.serviceSlug === 'tesis')) {
    total += data.amount;
    factors.push(`${data.label} (+Rp${data.amount.toLocaleString('id-ID')})`);
  }

  if (input.serviceSlug === 'analisis-data') {
    if (input.method === 'sem-pls') {
      total += 500_000;
      factors.push('Analisis SEM/PLS (+Rp500.000)');
    } else if (input.method === 'mixed') {
      total += 250_000;
      factors.push('Mixed-method (+Rp250.000)');
    } else if (input.method === 'kualitatif') {
      total += 200_000;
      factors.push('Analisis kualitatif (+Rp200.000)');
    } else if (input.method === 'rnd') {
      total += 300_000;
      factors.push('Penelitian R&D (+Rp300.000)');
    }
  }

  if (input.educationLevel === 'S3') {
    const extra = Math.round(total * 0.15);
    total += extra;
    factors.push(`Jenjang S3 (+15%, +Rp${extra.toLocaleString('id-ID')})`);
  }

  const remaining = daysUntil(input.deadline, now);
  if (remaining <= 6) {
    const extra = Math.round(total * 0.25);
    total += extra;
    factors.push(`Deadline kurang dari 7 hari (+25%, +Rp${extra.toLocaleString('id-ID')})`);
  } else if (remaining <= 13) {
    const extra = Math.round(total * 0.1);
    total += extra;
    factors.push(`Deadline kurang dari 14 hari (+10%, +Rp${extra.toLocaleString('id-ID')})`);
  }

  return { min: round50k(total * 0.9), max: round50k(total * 1.3), currency: 'IDR', factors };
}
