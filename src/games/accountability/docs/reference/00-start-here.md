# Mulai di Sini — Brief Implementasi Kasir Sat Set

Versi paket 1.2 · Bahasa produk: Indonesia · Platform: web desktop dan ponsel.

Paket ini berisi enam dokumen acuan dan README. Semua konteks yang dibutuhkan tersedia di dalam paket; riwayat percakapan atau spesifikasi satu file sebelumnya tidak diperlukan.

## Instruksi untuk AI agent

Jika paket ini diberikan sebagai brief untuk membangun game, **implementasikan sampai dapat dimainkan dan diverifikasi**, bukan hanya menghasilkan rencana. Jika pengguna hanya meminta reviu atau revisi dokumentasi, ikuti batas tugas tersebut.

1. Baca keenam dokumen sesuai urutan di bawah sebelum mengubah proyek.
2. Periksa struktur, instruksi proyek, dan batasan lingkungan yang berlaku. Pertahankan pekerjaan pengguna yang sudah ada.
3. Gunakan default yang telah ditetapkan. Detail kecil yang belum ditentukan dapat diputuskan sendiri selama tidak mengubah requirement.
4. Kerjakan tahap pada implementation plan, jalankan pengujian yang relevan, dan perbaiki kegagalan yang ditemukan.
5. Serahkan kode, aset, tes, README operasional, dan hasil verifikasi aktual.
6. Jika lingkungan mendukung, tampilkan pratinjau lokal yang benar-benar tersedia.
7. Teruskan bagian yang tidak terhambat bila ada keterbatasan. Laporkan pemeriksaan yang tidak bisa dilakukan, tanpa mengklaimnya lulus.

## Ringkasan produk

Pemain menjadi kasir warung, mencocokkan permintaan pembayaran pembeli dengan tiga pilihan: Tunai, EDC, dan QRIS. Pembeli serta metodenya acak. Sesi berlangsung 20 detik dan berakhir dengan skor. Semua aturan lengkap serta nilai konfigurasi dimiliki PRD.

## Urutan baca dan kewenangan dokumen

| Urutan | Dokumen | Pertanyaan yang dijawab | Sumber utama untuk |
| --- | --- | --- | --- |
| 0 | Dokumen ini | Bagaimana memulai dan menyelesaikan tugas? | Cara eksekusi paket serta kriteria selesai |
| 1 | [Product Requirements](01-product-requirements.md) | Mengapa dan apa yang dibangun? | Tujuan, batas lingkup, FR, metode, aturan, nilai parameter |
| 2 | [UX/UI Specification](02-ux-ui-spec.md) | Apa yang dilihat dan dilakukan pemain? | Layar, copy, visual, kontrol/fokus, viewport, aksesibilitas |
| 3 | [Technical Design](03-technical-design.md) | Bagaimana sistem bekerja? | Stack, modul, data, kontrak internal, algoritme, lifecycle |
| 4 | [Implementation Plan](04-implementation-plan.md) | Apa urutan pengerjaannya? | Tugas, dependensi, hasil tiap tahap, serah terima |
| 5 | [Test Plan](05-test-plan.md) | Bagaimana membuktikannya benar? | Skenario tes, matriks kebutuhan, bukti, pelaporan QA |

[README operasional](README.md) menjelaskan prasyarat font, instalasi, perintah, dan struktur implementasi. Keenam dokumen ini adalah spesifikasi lengkap; laporan aktual ada di [docs/verification.md](docs/verification.md).

## Aturan konsistensi dokumen

- Ikuti revisi eksplisit terbaru dari pengguna dan instruksi yang berlaku pada proyek/lingkungan.
- Setiap domain memiliki pemilik pada tabel di atas. Misalnya, nilai skor dari PRD mengikat contoh teknis serta ekspektasi tes.
- Contoh copy, pseudocode, dan kasus uji adalah penjabaran aturan; tidak boleh menjadi sumber aturan baru yang bertentangan.
- Koreksi salinan turunan yang berbeda dengan dokumen pemilik dan catat perubahan yang diperlukan. Jangan diam-diam memilih angka berbeda untuk UI dan mesin.
- Jika konflik penting tidak dapat diselesaikan dari instruksi serta pemilik domain, minta klarifikasi yang spesifik. Lanjutkan bagian yang independen.
- Spesifikasi satu file versi sebelumnya merupakan arsip. Paket versi 1.2 ini menjadi acuan aktif ketika digunakan sebagai brief.
- Jika aturan produk direvisi, perbarui PRD dahulu, lalu bagian UX/teknis/tes yang terdampak. Tidak perlu menduplikasi seluruh aturan di semua file.

## Keputusan yang sudah tersedia

- BRD dan PRD digabung karena lingkup kecil.
- Implementasi default adalah web game tanpa backend.
- API spec jaringan tidak diperlukan; kontrak modul internal ada di desain teknis.
- Framework UI, engine game, layanan gambar, dan akun layanan tidak dibutuhkan untuk menyelesaikan tugas.
- Skor, jeda, randomisasi, antrean, countdown auto-start, reset, viewport, input, font, palet, efek benar, dan hasil akhir sudah ditentukan; jangan membuka sesi klarifikasi untuk keputusan yang sudah tersedia.
- Pilihan ilustrasi rinci, nama komponen, serta penataan kode boleh disesuaikan selama memenuhi dokumen pemilik.

## Lingkup eksekusi

Pekerjaan mencakup implementasi, pengujian, perbaikan, dokumentasi hasil, dan pratinjau lokal. Publikasi ke internet hanya termasuk jika diminta secara terpisah.

Jangan mengembangkan fitur di luar lingkup PRD. Jangan menganggap teks placeholder, screenshot, atau prototype statis sebagai game selesai. Seluruh layar harus tersambung ke logika yang dapat dimainkan.

Jika hanya sebagian file diterima, cari file lain dalam folder yang diberikan. Jika tetap tidak tersedia dan isinya dibutuhkan untuk keputusan inti, sebutkan dokumen yang hilang; jangan mengarang persyaratan yang sudah memiliki dokumen pemilik.

## Definition of Done

- [ ] FR-01 sampai FR-10 terpenuhi.
- [ ] Tiga layar serta alur Mulai, Bermain, Hasil, dan Main Lagi berjalan.
- [ ] Parameter runtime sesuai PRD dan hanya ada tiga metode pembayaran.
- [ ] Randomisasi, skor, timer, lock, input lama, finalisasi, serta reset sesuai aturan.
- [ ] Mouse, sentuhan, keyboard, fokus, dan viewport target memenuhi UX/UI.
- [ ] `AU Passata` berlisensi tersedia lokal untuk reproduksi tipografi identik; tanpa file font, fallback harus dilaporkan.
- [ ] Semua tes logika wajib lulus dan build produksi berhasil.
- [ ] Verifikasi browser wajib telah dilakukan, dengan lingkungan dan hasil aktual dicatat.
- [ ] Tidak ada kegagalan aturan, error aplikasi, aset rusak, atau fitur wajib yang belum tersambung.
- [ ] Kode, aset, lockfile, tes, README operasional, serta laporan verifikasi tersedia.
- [ ] Instruksi menjalankan dapat diikuti dari instalasi sampai preview.

Jika pemeriksaan wajib belum dapat dilakukan, gunakan status **“implementasi tersedia, verifikasi belum lengkap”**, beserta daftar pemeriksaan tersisa dan alasannya. Jangan menandai checklist selesai hanya karena kode telah ditulis atau build berhasil.

## Respons akhir implementasi

Sampaikan lokasi proyek/pratinjau yang tersedia, perintah menjalankan, ringkasan fitur, hasil tes/build aktual, dan keterbatasan. Hindari klaim semua browser sudah diuji jika hanya satu yang tersedia.
