import type Database from 'better-sqlite3';

const SEED_TIMESTAMP = 1_758_854_400_000;

const items: Array<{ id: string; category: string; title: string; summary: string; sortOrder: number }> = [
  {
    id: 'sobatpaper-portfolio-1',
    category: 'Skripsi',
    title: 'Pendampingan Skripsi Manajemen Pemasaran',
    summary: 'Kerangka penelitian, kuesioner, analisis regresi, sampai formatting template kampus.',
    sortOrder: 1,
  },
  {
    id: 'sobatpaper-portfolio-2',
    category: 'Tesis',
    title: 'Pendampingan Tesis Magister Pendidikan',
    summary: 'Research gap, mixed-method, analisis data, dan review naskah per bab.',
    sortOrder: 2,
  },
  {
    id: 'sobatpaper-portfolio-3',
    category: 'Analisis Data',
    title: 'SEM/PLS untuk Riset Perilaku Konsumen',
    summary: 'Evaluasi model pengukuran dan struktural SmartPLS lengkap dengan interpretasi Bab 4.',
    sortOrder: 3,
  },
  {
    id: 'sobatpaper-portfolio-4',
    category: 'Artikel',
    title: 'Konversi Tesis menjadi Artikel SINTA 4',
    summary: 'Perampingan naskah ke struktur IMRAD dan formatting template jurnal target.',
    sortOrder: 4,
  },
  {
    id: 'sobatpaper-portfolio-5',
    category: 'Formatting',
    title: 'Editing & Sitasi Disertasi Awal',
    summary: 'Proofreading akademik, citation checking APA 7, dan perapian 200+ halaman.',
    sortOrder: 5,
  },
  {
    id: 'sobatpaper-portfolio-6',
    category: 'Education',
    title: 'Artikel Pengabdian Dosen',
    summary: 'Penulisan artikel berbasis data program pengabdian untuk jurnal nasional.',
    sortOrder: 6,
  },
];

export function run(database: Database.Database): void {
  const insert = database.prepare(
    `INSERT INTO portfolio_items (id, category, title, summary, sort_order, created_at, updated_at)
     VALUES (@id, @category, @title, @summary, @sortOrder, @createdAt, @updatedAt)
     ON CONFLICT (id) DO NOTHING`,
  );
  for (const item of items) {
    insert.run({ ...item, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP });
  }
}
