import type Database from 'better-sqlite3';

const SEED_TIMESTAMP = 1_758_854_400_000;

interface ServiceSeed {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  scope: string[];
  process: string[];
  estimatedTime: string;
  startingPrice: number;
  disclaimer: string | null;
  sortOrder: number;
  faqs: Array<{ question: string; answer: string }>;
}

const services: ServiceSeed[] = [
  {
    id: 'sobatpaper-service-skripsi',
    slug: 'skripsi',
    name: 'Pendampingan Skripsi',
    tagline: 'Pendampingan S1 dari topik sampai persiapan revisi.',
    description:
      'Layanan pendampingan skripsi membantu kamu menyusun penelitian yang rapi: ' +
      'memilih topik yang feasible, membangun kerangka penelitian, menulis tiap bab ' +
      'dengan struktur yang benar, sampai menyiapkan diri menghadapi revisi.\n\n' +
      'Kamu tetap menjadi peneliti utama — kami mendampingi proses berpikir, menulis, ' +
      'dan merapikan naskah agar sesuai standar akademik kampusmu.',
    scope: [
      'Konsultasi dan pematangan topik penelitian',
      'Penyusunan kerangka dan proposal penelitian',
      'Pendampingan metodologi (kuantitatif, kualitatif, R&D)',
      'Bantuan literature review dan sitasi',
      'Review dan perbaikan naskah per bab',
      'Analisis data dan interpretasi hasil',
      'Formatting sesuai template kampus',
      'Persiapan menghadapi revisi dan sidang',
    ],
    process: [
      'Konsultasi kebutuhan, topik, dan deadline',
      'Kirim dokumen dan panduan kampus yang tersedia',
      'Analisis scope dan penawaran harga final',
      'Pembayaran dan penjadwalan pengerjaan',
      'Pendampingan per tahap dengan review berkala',
      'Revisi sesuai kesepakatan dan serah terima final',
    ],
    estimatedTime: '2–8 minggu, tergantung scope dan kelengkapan data',
    startingPrice: 3000000,
    disclaimer:
      'Layanan ini berupa pendampingan dan bantuan akademik. Kami tidak menjanjikan kelulusan atau nilai tertentu.',
    sortOrder: 1,
    faqs: [
      {
        question: 'Apakah datanya harus sudah siap?',
        answer:
          'Tidak harus. Kalau datamu belum terkumpul, kami bantu petakan instrumen dan rencana pengambilannya dulu.',
      },
      {
        question: 'Bagaimana kalau revisi dari dosen pembimbing banyak?',
        answer:
          'Catatan revisi dibahas per poin, lalu naskah diperbaiki sesuai arahan pembimbing dalam window revisi yang disepakati.',
      },
      {
        question: 'Apakah bisa pendampingan per bab saja?',
        answer: 'Bisa. Scope bisa parsial, misalnya hanya Bab 3–4 atau hanya analisis data. Harga menyesuaikan scope.',
      },
    ],
  },
  {
    id: 'sobatpaper-service-tesis',
    slug: 'tesis',
    name: 'Pendampingan Tesis',
    tagline: 'Pendampingan S2 yang rapi dari proposal hingga akhir.',
    description:
      'Layanan pendampingan tesis untuk mahasiswa magister: pendalaman research gap, ' +
      'ketajaman metodologi, analisis data lanjutan, dan penulisan dengan standar ' +
      'publikasi.\n\n' +
      'Cocok untuk kamu yang bekerja sambil kuliah dan butuh partner diskusi yang ' +
      'responsif sekaligus menjaga kualitas akademik naskah.',
    scope: [
      'Konsultasi topik dan research gap',
      'Penyusunan proposal dan kerangka tesis',
      'Pendampingan metodologi dan desain instrumen',
      'Systematic literature review dan manajemen referensi',
      'Review naskah per bab dengan standar publikasi',
      'Analisis data lanjutan (regresi, SEM/PLS, kualitatif)',
      'Formatting template kampus dan persiapan ujian',
    ],
    process: [
      'Konsultasi kebutuhan, bidang, dan target jadwal',
      'Kirim dokumen, data, dan panduan kampus',
      'Analisis scope dan penawaran harga final',
      'Pembayaran dan penjadwalan milestone',
      'Pendampingan per milestone dengan review',
      'Revisi dan serah terima final',
    ],
    estimatedTime: '4–12 minggu, tergantung scope dan metode',
    startingPrice: 3500000,
    disclaimer:
      'Layanan ini berupa pendampingan dan bantuan akademik. Kami tidak menjanjikan kelulusan atau nilai tertentu.',
    sortOrder: 2,
    faqs: [
      {
        question: 'Apakah bisa dibantu sampai menjadi artikel jurnal?',
        answer:
          'Bisa. Setelah tesis selesai, naskah dapat dilanjutkan ke layanan konversi menjadi artikel jurnal SINTA.',
      },
      {
        question: 'Metode apa saja yang didukung?',
        answer:
          'Kuantitatif (termasuk SEM/PLS), kualitatif, mixed-method, dan R&D — disesuaikan dengan bidang ilmumu.',
      },
      {
        question: 'Bagaimana menjaga kerahasiaan data penelitian?',
        answer:
          'Dokumen hanya diakses tim yang mengerjakan pesananmu dan tidak dibagikan ke pihak mana pun tanpa izin.',
      },
    ],
  },
  {
    id: 'sobatpaper-service-analisis-data',
    slug: 'analisis-data',
    name: 'Analisis Data Penelitian',
    tagline: 'Olah data kuantitatif sampai interpretasi yang siap ditulis.',
    description:
      'Layanan analisis data untuk skripsi, tesis, dan artikel: pembersihan data, ' +
      'uji asumsi, analisis deskriptif dan inferensial, sampai interpretasi hasil ' +
      'dalam bahasa yang siap masuk ke Bab 4.\n\n' +
      'Hasil disertai output software, tabel siap tempel, dan penjelasan tiap uji ' +
      'sehingga kamu paham dan bisa mempertahankannya saat bimbingan.',
    scope: [
      'Pembersihan dan persiapan data (cleaning, coding, label)',
      'Statistik deskriptif dan visualisasi tabel/grafik',
      'Uji validitas dan reliabilitas instrumen',
      'Uji asumsi klasik (normalitas, multikolinearitas, heteroskedastisitas)',
      'Korelasi, regresi, uji beda, dan analisis jalur',
      'SEM/PLS dengan SmartPLS',
      'Interpretasi hasil siap tulis untuk Bab 4',
      'Software: SPSS, Jamovi, SmartPLS, Excel, R',
    ],
    process: [
      'Konsultasi metode, hipotesis, dan kondisi data',
      'Kirim file data dan instrumen/kuesioner',
      'Pemeriksaan kelayakan data dan penawaran harga',
      'Pembayaran dan pengerjaan analisis',
      'Review hasil dan interpretasi bersama',
      'Revisi dan serah terima output + tabel final',
    ],
    estimatedTime: '3–10 hari kerja, tergantung jumlah data dan metode',
    startingPrice: 500000,
    disclaimer:
      'Layanan ini tidak mencakup pembuatan data fiktif, manipulasi data, atau pemalsuan hasil penelitian.',
    sortOrder: 3,
    faqs: [
      {
        question: 'Format data seperti apa yang diterima?',
        answer: 'Excel, CSV, atau file SPSS (.sav). Kalau datamu masih di Google Form atau kuesioner fisik, konsultasikan dulu.',
      },
      {
        question: 'Apakah dapat output mentah softwarenya?',
        answer: 'Ya. Kamu menerima file output software, tabel hasil, dan dokumen interpretasi.',
      },
      {
        question: 'Bagaimana kalau datanya tidak memenuhi uji asumsi?',
        answer:
          'Kami laporkan apa adanya beserta opsi yang sah secara metodologi — misalnya transformasi data atau uji alternatif.',
      },
    ],
  },
  {
    id: 'sobatpaper-service-editing-formatting',
    slug: 'editing-formatting',
    name: 'Editing & Formatting',
    tagline: 'Naskah rapi, sitasi beres, template nurut.',
    description:
      'Layanan proofreading, academic writing, dan formatting agar naskahmu siap ' +
      'bimbingan, sidang, atau submit: perbaikan bahasa akademik, konsistensi ' +
      'struktur, pengecekan sitasi, dan penyesuaian template kampus atau jurnal.\n\n' +
      'Cocok untuk naskah yang isinya sudah jadi tapi tampilannya belum meyakinkan.',
    scope: [
      'Proofreading dan perbaikan bahasa akademik',
      'Pengecekan struktur dan alur antar bab',
      'Penyesuaian template kampus atau jurnal',
      'Gaya sitasi APA 7 dan format daftar pustaka',
      'Citation checking (sitasi vs daftar pustaka)',
      'Manajemen referensi Mendeley dan Zotero',
      'Perapian tabel, gambar, dan penomoran',
    ],
    process: [
      'Konsultasi kondisi naskah dan template target',
      'Kirim naskah dan file template kampus/jurnal',
      'Analisis scope dan penawaran harga',
      'Pembayaran dan pengerjaan editing',
      'Review hasil dengan lacak perubahan (track changes)',
      'Revisi dan serah terima naskah final',
    ],
    estimatedTime: '2–7 hari kerja, tergantung jumlah halaman',
    startingPrice: 300000,
    disclaimer: null,
    sortOrder: 4,
    faqs: [
      {
        question: 'Apakah isi atau argumen naskah ikut diubah?',
        answer:
          'Editing fokus ke bahasa, struktur, dan format. Kalau ada argumen yang janggal, kami beri catatan — keputusan tetap di tanganmu.',
      },
      {
        question: 'Template kampus saya rumit, bisa diikuti?',
        answer: 'Bisa. Kirim file template resminya, naskah akan disesuaikan margin, heading, spasi, dan penomorannya.',
      },
      {
        question: 'Bagaimana revisi setelah editing?',
        answer: 'Hasil dikirim dengan lacak perubahan. Koreksi lanjutan dalam window revisi tanpa biaya tambahan.',
      },
    ],
  },
  {
    id: 'sobatpaper-service-konversi-jurnal',
    slug: 'konversi-jurnal',
    name: 'Konversi Skripsi/Tesis → Artikel Jurnal',
    tagline: 'Ubah naskah tugas akhirmu menjadi artikel siap submit.',
    description:
      'Naskah skripsi atau tesismu diolah menjadi artikel ilmiah yang ringkas dan ' +
      'tajam: penyesuaian struktur IMRAD, penulisan ulang abstrak, perampingan ' +
      'tinjauan pustaka, dan formatting sesuai template jurnal target.\n\n' +
      'Target jurnal dikelompokkan SINTA 6, 5, 4, dan 3 — pendampingan disesuaikan ' +
      'dengan standar tiap tier.',
    scope: [
      'Pemetaan naskah menjadi struktur artikel (IMRAD)',
      'Penulisan ulang abstrak dan kata kunci',
      'Perampingan pendahuluan, metode, dan pembahasan',
      'Penyesuaian gaya sitasi dan daftar pustaka jurnal',
      'Formatting sesuai template jurnal target',
      'Simulasi cek kelayakan sebelum submit',
    ],
    process: [
      'Konsultasi naskah dan target jurnal',
      'Kirim naskah final dan template jurnal',
      'Analisis kelayakan dan penawaran harga',
      'Pembayaran dan pengerjaan konversi',
      'Review artikel bersama',
      'Revisi dan serah terima artikel siap submit',
    ],
    estimatedTime: '1–3 minggu per artikel',
    startingPrice: 500000,
    disclaimer:
      'Kami tidak menjanjikan artikel pasti diterima jurnal — keputusan penerimaan merupakan kewenangan editor dan reviewer.',
    sortOrder: 5,
    faqs: [
      {
        question: 'Naskah saya nilainya biasa saja, bisa jadi artikel?',
        answer:
          'Bisa, selama ada temuan yang layak. Kami bantu menilai kelayakannya di awal — kalau belum layak, kami sampaikan jujur.',
      },
      {
        question: 'Apakah biaya APC/publikasi termasuk?',
        answer: 'Tidak. Biaya publikasi atau APC jurnal dibayar langsung oleh penulis ke penerbit, kecuali dinyatakan dalam paket.',
      },
      {
        question: 'Bagaimana kalau artikel direvisi reviewer?',
        answer: 'Revisi reviewer dapat dibantu sebagai pekerjaan lanjutan dengan penawaran terpisah sesuai bobot revisinya.',
      },
    ],
  },
  {
    id: 'sobatpaper-service-artikel-ilmiah',
    slug: 'artikel-ilmiah',
    name: 'Penulisan Artikel Ilmiah',
    tagline: 'Artikel berbasis data riset, dari nol sampai siap submit.',
    description:
      'Layanan penulisan dan pendampingan artikel ilmiah berbasis data penelitianmu: ' +
      'dari perumusan masalah, analisis, sampai naskah lengkap sesuai template ' +
      'jurnal target SINTA 6 hingga SINTA 3.\n\n' +
      'Ideal untuk dosen, guru, dan peneliti yang datanya sudah ada tapi waktunya ' +
      'habis untuk menulis.',
    scope: [
      'Perumusan masalah dan kebaruan (novelty) artikel',
      'Analisis data penelitian pendukung artikel',
      'Penulisan naskah lengkap sesuai struktur jurnal',
      'Abstrak, kata kunci, dan cover letter',
      'Sitasi dan daftar pustaka sesuai gaya jurnal',
      'Formatting template jurnal target',
    ],
    process: [
      'Konsultasi data, bidang, dan target jurnal',
      'Kirim data dan referensi pendukung',
      'Analisis scope dan penawaran harga',
      'Pembayaran dan penulisan bertahap',
      'Review naskah per bagian',
      'Revisi dan serah terima artikel siap submit',
    ],
    estimatedTime: '3–8 minggu per artikel',
    startingPrice: 1500000,
    disclaimer:
      'Kami tidak menjanjikan artikel pasti diterima jurnal — keputusan penerimaan merupakan kewenangan editor dan reviewer.',
    sortOrder: 6,
    faqs: [
      {
        question: 'Data seperti apa yang dibutuhkan?',
        answer:
          'Data primer (survei, wawancara, eksperimen) atau data sekunder yang sudah kamu miliki hak pakainya.',
      },
      {
        question: 'Siapa yang menjadi penulis artikel?',
        answer: 'Kamu (dan kolega yang kamu tunjuk). Kami berperan sebagai pendamping penulisan, bukan ghost author yang mengklaim.',
      },
      {
        question: 'Apakah bisa target jurnal internasional?',
        answer: 'Fokus utama kami SINTA 3–6. Untuk target lain, sampaikan dulu — kami nilai kelayakannya sebelum menyanggupi.',
      },
    ],
  },
];

export function run(database: Database.Database): void {
  const insertService = database.prepare(
    `INSERT INTO services (id, slug, name, tagline, description, scope, process, estimated_time, starting_price, disclaimer, sort_order, created_at, updated_at)
     VALUES (@id, @slug, @name, @tagline, @description, @scope, @process, @estimatedTime, @startingPrice, @disclaimer, @sortOrder, @createdAt, @updatedAt)
     ON CONFLICT (slug) DO NOTHING`,
  );
  const insertFaq = database.prepare(
    `INSERT INTO service_faqs (id, service_id, question, answer, sort_order, created_at, updated_at)
     VALUES (@id, @serviceId, @question, @answer, @sortOrder, @createdAt, @updatedAt)
     ON CONFLICT (id) DO NOTHING`,
  );

  for (const service of services) {
    insertService.run({
      ...service,
      scope: JSON.stringify(service.scope),
      process: JSON.stringify(service.process),
      faqs: undefined,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    });
    service.faqs.forEach((faq, index) => {
      insertFaq.run({
        id: `${service.id}:faq:${index + 1}`,
        serviceId: service.id,
        ...faq,
        sortOrder: index + 1,
        createdAt: SEED_TIMESTAMP,
        updatedAt: SEED_TIMESTAMP,
      });
    });
  }
}
