import type Database from 'better-sqlite3';

const SEED_TIMESTAMP = 1_758_854_400_000;

const testimonials: Array<{ id: string; displayName: string; role: string; content: string; sortOrder: number }> = [
  {
    id: 'sobatpaper-testimonial-1',
    displayName: 'A***',
    role: 'Mahasiswa S2',
    content: 'Analisis SEM-nya rapi dan dijelasin sampai saya paham. Bimbingan Bab 4 jadi jauh lebih lancar.',
    sortOrder: 1,
  },
  {
    id: 'sobatpaper-testimonial-2',
    displayName: 'R***',
    role: 'Mahasiswa S1',
    content: 'Topik saya yang awalnya berantakan dibantu dipetakan sampai feasible. Revisinya juga dikawal.',
    sortOrder: 2,
  },
  {
    id: 'sobatpaper-testimonial-3',
    displayName: 'D***',
    role: 'Dosen',
    content: 'Tesis saya dikonversi jadi artikel sesuai template jurnal. Prosesnya transparan dari awal.',
    sortOrder: 3,
  },
  {
    id: 'sobatpaper-testimonial-4',
    displayName: 'M***',
    role: 'Guru',
    content: 'Editing dan sitasi APA-nya teliti. Naskah 100+ halaman beres tanpa drama.',
    sortOrder: 4,
  },
];

export function run(database: Database.Database): void {
  const insert = database.prepare(
    `INSERT INTO testimonials (id, display_name, role, content, sort_order, created_at, updated_at)
     VALUES (@id, @displayName, @role, @content, @sortOrder, @createdAt, @updatedAt)
     ON CONFLICT (id) DO NOTHING`,
  );
  for (const testimonial of testimonials) {
    insert.run({ ...testimonial, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP });
  }
}
