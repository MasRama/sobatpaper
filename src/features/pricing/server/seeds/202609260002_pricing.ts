import type Database from 'better-sqlite3';

const SEED_TIMESTAMP = 1_758_854_400_000;

interface PackageSeed {
  id: string;
  groupSlug: string;
  groupName: string;
  name: string;
  price: number;
  unit: string | null;
  note: string | null;
  sortOrder: number;
}

const packages: PackageSeed[] = [
  { id: 'sobatpaper-price-revisi-skripsi', groupSlug: 'revisi', groupName: 'Revisi', name: 'Revisi Skripsi', price: 300000, unit: 'mulai dari', note: null, sortOrder: 1 },
  { id: 'sobatpaper-price-revisi-tesis', groupSlug: 'revisi', groupName: 'Revisi', name: 'Revisi Tesis', price: 500000, unit: 'mulai dari', note: null, sortOrder: 2 },
  { id: 'sobatpaper-price-analisis', groupSlug: 'analisis', groupName: 'Analisis Data', name: 'Analisis Data Penelitian', price: 500000, unit: 'mulai dari', note: null, sortOrder: 3 },
  { id: 'sobatpaper-price-pendampingan-skripsi', groupSlug: 'pendampingan', groupName: 'Pendampingan', name: 'Pendampingan Skripsi', price: 3000000, unit: 'mulai dari', note: null, sortOrder: 4 },
  { id: 'sobatpaper-price-pendampingan-tesis', groupSlug: 'pendampingan', groupName: 'Pendampingan', name: 'Pendampingan Tesis', price: 3500000, unit: 'mulai dari', note: null, sortOrder: 5 },
  { id: 'sobatpaper-price-konversi-s6', groupSlug: 'konversi', groupName: 'Konversi Skripsi/Tesis → Artikel', name: 'SINTA 6', price: 500000, unit: 'per artikel', note: null, sortOrder: 6 },
  { id: 'sobatpaper-price-konversi-s5', groupSlug: 'konversi', groupName: 'Konversi Skripsi/Tesis → Artikel', name: 'SINTA 5', price: 750000, unit: 'per artikel', note: null, sortOrder: 7 },
  { id: 'sobatpaper-price-konversi-s4', groupSlug: 'konversi', groupName: 'Konversi Skripsi/Tesis → Artikel', name: 'SINTA 4', price: 1000000, unit: 'per artikel', note: null, sortOrder: 8 },
  { id: 'sobatpaper-price-konversi-s3', groupSlug: 'konversi', groupName: 'Konversi Skripsi/Tesis → Artikel', name: 'SINTA 3', price: 1500000, unit: 'per artikel', note: null, sortOrder: 9 },
  { id: 'sobatpaper-price-artikel-s6', groupSlug: 'artikel-nol', groupName: 'Artikel dari Nol (Berbasis Data)', name: 'SINTA 6', price: 1500000, unit: 'per artikel', note: null, sortOrder: 10 },
  { id: 'sobatpaper-price-artikel-s5', groupSlug: 'artikel-nol', groupName: 'Artikel dari Nol (Berbasis Data)', name: 'SINTA 5', price: 2000000, unit: 'per artikel', note: null, sortOrder: 11 },
  { id: 'sobatpaper-price-artikel-s4', groupSlug: 'artikel-nol', groupName: 'Artikel dari Nol (Berbasis Data)', name: 'SINTA 4', price: 3000000, unit: 'per artikel', note: null, sortOrder: 12 },
  { id: 'sobatpaper-price-artikel-s3', groupSlug: 'artikel-nol', groupName: 'Artikel dari Nol (Berbasis Data)', name: 'SINTA 3', price: 5000000, unit: 'per artikel', note: null, sortOrder: 13 },
];

export function run(database: Database.Database): void {
  const insert = database.prepare(
    `INSERT INTO pricing_packages (id, group_slug, group_name, name, price, unit, note, sort_order, created_at, updated_at)
     VALUES (@id, @groupSlug, @groupName, @name, @price, @unit, @note, @sortOrder, @createdAt, @updatedAt)
     ON CONFLICT (id) DO NOTHING`,
  );
  for (const item of packages) {
    insert.run({ ...item, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP });
  }
}
