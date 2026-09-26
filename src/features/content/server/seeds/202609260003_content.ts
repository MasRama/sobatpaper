import type Database from 'better-sqlite3';

const SEED_TIMESTAMP = 1_758_854_400_000;

const pages: Array<{ id: string; slug: string; title: string; body: string }> = [
  {
    id: 'sobatpaper-page-tentang',
    slug: 'tentang-kami',
    title: 'Tentang Kami',
    body: `SobatPaper.id adalah Academic Research Partner — layanan pendampingan penelitian, penulisan akademik, analisis data, editing, formatting, dan publikasi artikel ilmiah untuk mahasiswa S1, S2, guru, dosen, dan peneliti.

Kami percaya proses riset yang baik lahir dari diskusi yang jujur dan pengerjaan yang rapi. Karena itu setiap pesanan dimulai dari konsultasi: kami petakan kebutuhan, scope, dan estimasi biayanya secara transparan sebelum ada komitmen apa pun.

## Apa yang kami lakukan

- Pendampingan skripsi, tesis, dan artikel ilmiah
- Analisis data kuantitatif sampai SEM/PLS
- Editing, proofreading, dan formatting template
- Konversi skripsi/tesis menjadi artikel jurnal

## Prinsip kami

- Pendampingan akademik, bukan jalan pintas
- Tanpa klaim kelulusan, nilai, atau penerimaan jurnal
- Tanpa data fiktif dan tanpa manipulasi hasil
- Dokumen customer rahasia dan tidak dibagikan`,
  },
  {
    id: 'sobatpaper-page-privasi',
    slug: 'kebijakan-privasi',
    title: 'Kebijakan Privasi',
    body: `Kebijakan ini menjelaskan data apa yang kami kumpulkan saat kamu memakai SobatPaper.id dan bagaimana kami menjaganya.

## Data yang kami kumpulkan

- Data kontak: nama, nomor WhatsApp, dan email
- Data pesanan: jenjang, bidang, topik, metode, dan deadline
- Dokumen yang kamu unggah untuk keperluan pengerjaan

## Penggunaan data

- Data dipakai hanya untuk konsultasi, pengerjaan pesanan, dan komunikasi terkait layanan. Kami tidak menjual atau membagikan datamu ke pihak ketiga untuk pemasaran.

## Penyimpanan dan akses

- Dokumen disimpan di penyimpanan privat dan hanya dapat diakses tim yang mengerjakan pesananmu. Akses administratif tercatat dan terbatas.

## Hak kamu

- Kamu dapat meminta salinan, perbaikan, atau penghapusan datamu dengan menghubungi kami melalui WhatsApp atau email resmi. Penghapusan dilakukan sejauh tidak melanggar kewajiban pencatatan yang berlaku.`,
  },
  {
    id: 'sobatpaper-page-syarat',
    slug: 'syarat-ketentuan',
    title: 'Syarat & Ketentuan',
    body: `Dengan memakai layanan SobatPaper.id, kamu menyetujui ketentuan berikut.

## Layanan

- SobatPaper menyediakan bantuan konsultasi, analisis, editing, formatting, dan pendampingan akademik. Keputusan akademik (nilai, kelulusan, penerimaan jurnal) sepenuhnya berada di institusi, penguji, editor, dan reviewer yang berwenang.

## Pemesanan dan pembayaran

- Harga final dan scope disepakati tertulis sebelum pengerjaan. Pengerjaan dimulai setelah pembayaran sesuai kesepakatan. Keterlambatan data atau dokumen dari customer dapat menggeser jadwal.

## Revisi

- Setiap pesanan mencakup window revisi sesuai paket. Revisi di luar scope awal atau di luar window dihitung sebagai pekerjaan tambahan.

## Hal yang tidak kami layani

- Pembuatan data fiktif, manipulasi data, pemalsuan hasil, dan segala bentuk academic misconduct. Pesanan yang mengarah ke sana akan kami tolak atau hentikan.`,
  },
  {
    id: 'sobatpaper-page-refund',
    slug: 'kebijakan-refund',
    title: 'Kebijakan Refund',
    body: `Kami ingin setiap pembayaran terasa adil bagi kedua belah pihak.

## Refund penuh

- Pengajuan sebelum pengerjaan dimulai dan sebelum dokumen dianalisis lebih lanjut. Dana kembali 100%.

## Refund sebagian

- Pembatalan di tengah pengerjaan: biaya dihitung proporsional dari progres yang sudah dikerjakan, sisanya dikembalikan.

## Tidak dapat di-refund

- File final sudah diserahkan dan sesuai scope yang disepakati. Ketidakpuasan karena ekspektasi di luar scope (misalnya jaminan nilai atau penerimaan jurnal) bukan dasar refund karena hal tersebut memang tidak pernah kami janjikan.

## Cara mengajukan

- Sampaikan pembatalan melalui WhatsApp resmi dengan nomor order. Refund yang disetujui diproses maksimal 7 hari kerja ke rekening atau e-wallet yang kamu tunjuk.`,
  },
  {
    id: 'sobatpaper-page-disclaimer',
    slug: 'disclaimer',
    title: 'Disclaimer',
    body: `SobatPaper.id adalah layanan bantuan konsultasi, editing, analisis, formatting, dan pendampingan akademik.

- Naskah, analisis, dan artikel yang kami bantu tetap menjadi tanggung jawab akademik penulis. Pastikan kamu memahami isinya sebelum diserahkan ke pembimbing atau jurnal.
- Kami tidak menjanjikan kelulusan, nilai tertentu, atau diterimanya artikel di jurnal mana pun.
- Kami tidak membuat data fiktif, tidak memanipulasi data, dan tidak memalsukan hasil penelitian dalam kondisi apa pun.
- Biaya publikasi atau APC jurnal menjadi tanggung jawab penulis dan dibayar langsung ke penerbit, kecuali dinyatakan eksplisit dalam paket.`,
  },
];

const faqs: Array<{ id: string; category: string; question: string; answer: string; sortOrder: number }> = [
  { id: 'sobatpaper-faq-1', category: 'umum', question: 'Apakah konsultasi awal berbayar?', answer: 'Gratis. Sampaikan kebutuhan, topik, metode, dan deadline lewat WhatsApp atau form order, lalu kami beri estimasi biaya dan prosesnya sebelum kamu memutuskan.', sortOrder: 1 },
  { id: 'sobatpaper-faq-2', category: 'umum', question: 'Bagaimana harga dihitung?', answer: 'Dari jenis layanan, bidang, tingkat kesulitan, jumlah halaman, metode, kondisi data, dan deadline. Harga di halaman Harga adalah harga mulai; harga final selalu disepakati tertulis.', sortOrder: 2 },
  { id: 'sobatpaper-faq-3', category: 'umum', question: 'Berapa lama pengerjaannya?', answer: 'Analisis data 3–10 hari kerja, editing 2–7 hari kerja, pendampingan skripsi/tesis 2–12 minggu. Estimasi pasti diberikan setelah analisis scope.', sortOrder: 3 },
  { id: 'sobatpaper-faq-4', category: 'umum', question: 'Bagaimana kebijakan revisinya?', answer: 'Setiap pesanan mencakup window revisi sesuai paket. Revisi dosen pembimbing atau reviewer dibahas per poin; pekerjaan di luar scope awal dihitung terpisah.', sortOrder: 4 },
  { id: 'sobatpaper-faq-5', category: 'umum', question: 'Apakah dokumen saya rahasia?', answer: 'Ya. Dokumen hanya diakses tim yang mengerjakan pesananmu, disimpan privat, dan tidak dibagikan tanpa izin. Detailnya ada di Kebijakan Privasi.', sortOrder: 5 },
  { id: 'sobatpaper-faq-6', category: 'umum', question: 'Metode penelitian apa saja yang didukung?', answer: 'Kuantitatif (deskriptif, inferensial, regresi, SEM/PLS), kualitatif, mixed-method, dan R&D — dengan SPSS, Jamovi, SmartPLS, Excel, atau R.', sortOrder: 6 },
  { id: 'sobatpaper-faq-7', category: 'umum', question: 'Apakah dibantu sampai artikel diterima jurnal?', answer: 'Kami bantu sampai artikel siap submit sesuai template jurnal target. Keputusan diterima atau tidak ada di editor dan reviewer — hal itu tidak bisa dijanjikan siapa pun.', sortOrder: 7 },
  { id: 'sobatpaper-faq-8', category: 'umum', question: 'Apakah biaya APC/publikasi termasuk?', answer: 'Tidak. Biaya publikasi dibayar langsung oleh penulis ke penerbit, kecuali dinyatakan eksplisit dalam paket yang kamu ambil.', sortOrder: 8 },
  { id: 'sobatpaper-faq-9', category: 'umum', question: 'Bagaimana alur pemesanannya?', answer: 'Konsultasi → kirim kebutuhan/dokumen → analisis scope → penawaran harga → pembayaran → pengerjaan → review/revisi → final. Lihat halaman Cara Kerja untuk detailnya.', sortOrder: 9 },
  { id: 'sobatpaper-faq-10', category: 'umum', question: 'Apakah bisa dibuatkan data penelitian?', answer: 'Tidak. Kami tidak membuat data fiktif, memanipulasi data, atau memalsukan hasil dalam bentuk apa pun. Kalau datamu bermasalah, kami bantu cari solusi yang sah secara metodologi.', sortOrder: 10 },
];

export function run(database: Database.Database): void {
  const insertPage = database.prepare(
    `INSERT INTO content_pages (id, slug, title, body, created_at, updated_at)
     VALUES (@id, @slug, @title, @body, @createdAt, @updatedAt)
     ON CONFLICT (slug) DO NOTHING`,
  );
  for (const page of pages) {
    insertPage.run({ ...page, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP });
  }
  const insertFaq = database.prepare(
    `INSERT INTO faqs (id, category, question, answer, sort_order, created_at, updated_at)
     VALUES (@id, @category, @question, @answer, @sortOrder, @createdAt, @updatedAt)
     ON CONFLICT (id) DO NOTHING`,
  );
  for (const faq of faqs) {
    insertFaq.run({ ...faq, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP });
  }
}
