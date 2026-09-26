import type Database from 'better-sqlite3';

const SEED_TIMESTAMP = 1_758_854_400_000;

const settings: Array<{ key: string; value: string }> = [
  { key: 'whatsapp_number', value: '6280000000000' },
  {
    key: 'consultation_message',
    value: 'Halo SobatPaper, saya ingin konsultasi layanan. Mohon informasi estimasi biaya dan prosesnya.',
  },
];

export function run(database: Database.Database): void {
  const insert = database.prepare(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES (@key, @value, @updatedAt)
     ON CONFLICT (key) DO NOTHING`,
  );
  for (const setting of settings) {
    insert.run({ ...setting, updatedAt: SEED_TIMESTAMP });
  }
}
