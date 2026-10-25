# UX/UI Specification — Kasir Sat Set

Versi 1.2 · Status: acuan tampilan dan interaksi.

Kembali ke [panduan mulai](00-start-here.md). Aturan dan parameter berasal dari [PRD](01-product-requirements.md); dokumen ini mengatur penyajiannya kepada pemain. Cara menghubungkan UI ke mesin permainan ada pada [desain teknis](03-technical-design.md).

## UX-01 — Alur pengguna

```text
Awal → Mulai → Permainan → Waktu habis → Hasil
                   ↑                        │
                   └────── Main Lagi ────────┘
```

Pemain harus memahami permintaan dan dapat menjangkau ketiga pilihan tanpa membuka menu lain. Permainan mempertahankan susunan kontrol selama satu sesi.

## UX-02 — Layar dan copy

Angka pada copy di bawah adalah tampilan yang dihasilkan oleh parameter PRD versi ini. Implementasikan sebagai teks yang bersumber dari konfigurasi, bukan nilai aturan kedua yang berdiri sendiri.

### Layar awal

Tampilkan:

- Judul: **Kasir Sat Set**.
- Poin benar, penalti salah, dan skor minimum.
- Pratinjau tiga metode pembayaran.
- Tombol utama: **Mulai**.
- Countdown `5, 4, 3, 2, 1`; mulai otomatis saat mencapai 0 bila pemain belum memilih tombol.

Jangan tampilkan subjudul atau instruksi tambahan pada layar awal. Angka countdown terlihat di dalam tombol dan berubah setiap detik: `5`, `4`, `3`, `2`, `1`, lalu auto-start. Klik/tap/aktivasi keyboard pada tombol Mulai menghentikan countdown serta memulai sesi langsung.

### Layar permainan

Susunan vertikal:

1. Bagian atas: **Waktu** dan **Skor** dengan angka yang besar dan mudah dibaca.
2. Area utama: latar warung, antrean tiga pembeli bergaya ilustrasi, balon permintaan pembeli terdepan, dan meja kasir.
3. Area feedback: ruang tetap untuk respons benar atau salah agar elemen lain tidak bergeser.
4. Bagian bawah: tiga tombol dalam urutan tetap **TUNAI — EDC — QRIS**.

Antrean, permintaan pembeli aktif, waktu, skor, dan tiga tombol harus terlihat bersamaan selama bermain pada ukuran target. Dua pembeli yang menunggu masing-masing membawa token ikon metode yang sudah ditetapkan; pergantian antrean menggeser orang berikutnya ke kasir. Tombol jangan berpindah posisi saat karakter atau feedback berubah.

Ketika sisa waktu mencapai ambang `urgentTimeMs` pada PRD, beri penekanan melalui warna, ikon, dan teks timer. Jangan memakai kedipan cepat.

### Layar hasil

Tampilkan:

- Judul: **Waktu Habis!**
- **Skor akhir** sebagai angka paling menonjol.
- **Pembeli terlayani**: nilai `servedCount`.
- **Pilihan salah**: nilai `wrongCount`.
- Pesan: **“Cepat itu penting. Tepat melayani adalah tanggung jawab kita.”**
- Tombol utama: **Main Lagi**.

Tidak ada ambang lulus/gagal. Skor 0 tetap menampilkan hasil yang valid dan tombol Main Lagi.

## UX-03 — Balon permintaan dan feedback

Label dan ID pembayaran mengikuti PRD FR-01. Gunakan copy berikut:

| Metode | Kalimat pembeli | Ikon dekoratif |
| --- | --- | --- |
| TUNAI | “Saya bayar tunai, ya!” | Uang kertas |
| EDC | “Saya bayar pakai kartu, ya!” | Kartu atau mesin EDC |
| QRIS | “Saya bayar pakai QRIS, ya!” | Simbol QR |

Balon menampilkan kalimat dan label metode secara bersamaan. Simbol QR berupa ilustrasi dan tidak perlu dapat dipindai.

| Kondisi | Copy | Penyajian |
| --- | --- | --- |
| Benar | `Benar! +{correctPoints}` | Teks, tanda centang, tanda `$` melayang, dan bunyi singkat “cring” |
| Salah | `Belum sesuai! Penalti {wrongPenalty} poin` | Teks serta tanda silang |
| Menunggu pilihan | Tidak ada feedback tindakan | Sisakan ruang agar tata letak tidak bergeser |

Feedback salah tetap menyatakan besaran penalti dasar meskipun skor tertahan pada minimum; skor aktual harus menampilkan nilai hasil penerapan batas bawah. Aturan minimum juga tersedia di layar awal.

## UX-04 — Panduan visual dan aset

Gunakan gaya ilustrasi 2D yang ramah, sederhana, dan terasa seperti warung Indonesia.

- Latar: biru muda/putih, rak barang sederhana, kanopi atau papan kecil bertuliskan **WARUNG**.
- Meja kasir: bentuk yang jelas di depan pembeli.
- Karakter anonim: variasi rambut, pakaian, kacamata, dan aksesori; gunakan minimal enam kombinasi yang mudah dibedakan. Jangan tampilkan nama atau nomor pembeli.
- Tipografi: `AU Passata` untuk seluruh teks dan angka, menggunakan weight Regular/Medium/Bold yang sesuai elemen. File font harus resmi, berlisensi, dan tersedia lokal; jangan memuat dari CDN. Fallback Arial hanya untuk preview saat aset tersebut tidak tersedia.
- Permintaan pembayaran: balon terang dengan teks gelap, ditempatkan dekat pembeli.
- Tombol: besar, berlabel jelas, dilengkapi ikon uang, kartu/EDC, dan QR.
- Warna acuan: biru `#00549A`, biru tua `#003E73`, putih `#F8FAFC`, dan kuning `#FFC629`; palet terinspirasi BRI tanpa memakai logo resmi.
- Warna acuan boleh disesuaikan untuk memenuhi keterbacaan. Token implementasi: ink `#152F4D`, ink-soft `#415D79`, surface `#F8FAFC`, blue `#00549A`, blue-dark `#003E73`, pale-blue `#E1EFFB`, yellow `#FFC629`, warning `#815600`, muted `#465E77`.
- Warna tombol tidak perlu disalin ke balon permintaan; pemain mencocokkan label dan ikon.
- Animasi harus singkat, tidak menghalangi pilihan, dan tidak membuat posisi tombol bergerak.
- Karakter yang mengantre memiliki siklus langkah ringan. Saat jawaban benar selesai, pembeli terdepan keluar dan orang berikutnya maju ke kasir; animasi tidak menentukan waktu lock.
- Feedback benar/salah harus memakai teks atau ikon selain warna.

### Token dan geometri reproduksi

- Font family untuk seluruh UI: `AU Passata`, fallback `AU Passata Regular`, lalu Arial/sans-serif. Target identik wajib memakai file AU Passata resmi dengan versi dan weight yang sama secara lokal; fallback bukan hasil yang identik.
- Heading landing desktop: 94 px, line-height 0.92, tebal, satu baris per kata; “Sat Set” italic berwarna kuning. Pada viewport mobile sampai 700 px gunakan 64 px; landscape pendek sampai 500 px gunakan 50 px.
- Landing: shell max-width 1120 px; satu kolom konten max-width 560 px di tengah. Score line 16 px desktop, 14 px mobile, 12 px landscape pendek. Preview metode 3 kolom sama lebar, gap 10 px, tinggi minimal 70 px; tombol Mulai lebar 254 px, tinggi 108 px kecuali landscape pendek.
- Warna utama implementasi: ink `#152F4D`, ink soft `#415D79`, surface `#F8FAFC`, surface deep `#E9F0F7`, primary blue `#00549A`, dark blue `#003E73`, pale blue `#E1EFFB`, yellow `#FFC629`, yellow shadow `#815600`, muted `#465E77`. Body `#EAF2FA` dengan titik biru transparan pada grid 13 px dan wash biru/kuning.
- Game desktop max-width 850 px dengan grid baris `58px / minmax(190px, 1fr) / 36px / 78px` dan gap 8 px. Mobile sampai 700 px memakai `50px / minmax(0, 1fr) / 30px / 68px`, gap 5 px; landscape pendek memakai `38px / minmax(105px, 1fr) / 24px / 54px`, gap 3 px. Di landscape pendek tombol 48 px minimum.
- Antrean menempatkan orang aktif pada x=78%, posisi tunggu berikut pada 59%, lalu 40%; ukuran relatif mengecil untuk menunjukkan kedalaman. Pada mobile gunakan x=77%, 62%, 47%; landscape desktop pendek x=86%, 70%, 54%. Status terlihat hanya **KASIR** untuk orang terdepan dan **ANTRE** untuk lainnya.
- Gerak langkah memakai siklus 320 ms; lineup bergeser 420 ms; keluar customer 260 ms. `$` naik 125 px dan fade selama 850 ms. Reduced motion memendekkan motion visual menjadi 0.01 ms tanpa mengubah skor/timer/lock.
- Pada jawaban benar, tiga glyph `$` muncul dari area antrean (posisi horizontal 43%, 56%, 69%), bergerak ke atas selama 850 ms, lalu dihapus. Bunyi “cring” lokal disintesis Web Audio selama 370 ms; keduanya tidak mengubah lock 120 ms.

Buat aset SVG/CSS sendiri. Jangan menunggu akses ke generator gambar atau aset berbayar. Jangan mengambil foto orang, logo bank, atau ilustrasi tanpa izin. Tidak diperlukan logo resmi penyedia pembayaran.

Semua aset yang digunakan harus tersedia dalam proyek. Jangan meninggalkan placeholder, gambar rusak, atau teks contoh yang tidak relevan pada hasil akhir.

## UX-05 — Responsivitas dan aksesibilitas

### Ukuran target

Verifikasi setidaknya pada viewport:

- **360 × 640**: ponsel kecil.
- **390 × 844**: ponsel portrait.
- **844 × 390**: ponsel landscape.
- **1366 × 768**: desktop.

Pada ukuran tersebut, layar permainan harus dapat dimainkan tanpa scroll, tanpa elemen terpotong, dan tanpa tiga tombol saling menutupi. Pada layar pendek, kecilkan dekorasi dan karakter terlebih dahulu. Pertahankan label, timer, dan area tekan tombol.

Di luar ukuran target, izinkan scroll vertikal bila diperlukan, dengan seluruh kontrol tetap dapat dicapai dan tanpa scroll horizontal.

### Ketentuan aksesibilitas

- Setiap tombol pembayaran memiliki area tekan minimal **48 × 48 CSS px**.
- Rasio kontras teks biasa terhadap latarnya minimal **4,5:1**.
- Fokus keyboard harus terlihat.
- Setiap tombol memiliki nama aksesibel yang sesuai label pembayaran.
- Ikon dekoratif tidak perlu dibacakan terpisah dari label tombol.
- Tandai bahasa halaman sebagai `id`.
- Umumkan permintaan pembeli dan hasil tindakan melalui area status yang wajar; jangan membacakan timer setiap frame atau setiap detik.
- Setelah Mulai, arahkan fokus secara wajar ke area kontrol. Pastikan penguncian input singkat tidak membuang fokus keyboard; pulihkan ke pilihan sebelumnya saat terbuka jika masih relevan.
- Saat hasil muncul, arahkan fokus ke judul hasil atau area hasil; Main Lagi harus mudah dicapai.
- Hormati preferensi pengurangan animasi. Pengurangan animasi hanya mengubah visual; durasi sesi serta jeda input tetap sama.
- Jangan mematikan kemampuan zoom browser secara global.

## UX-06 — Kontrol dan fokus

- Gunakan tiga tombol dengan urutan kiri ke kanan TUNAI, EDC, QRIS. Pertahankan urutan pada semua viewport target.
- Tampilkan perbedaan keadaan normal, hover pada perangkat yang mendukung, fokus, ditekan, serta input terkunci.
- Keadaan input terkunci harus menolak aktivasi secara fungsional, bukan hanya berubah warna.
- Penguncian singkat tidak boleh menghilangkan posisi fokus secara permanen. Jika fokus hilang akibat kontrol dinonaktifkan, pulihkan ketika terbuka; jangan menarik fokus dari tempat lain yang sengaja dipilih pemain.
- Jangan mengganti seluruh area tombol setiap frame. Pembaruan pembeli tidak boleh menukar urutan kontrol.
- Keyboard memakai Tab, Enter, dan Space. Shortcut tambahan tidak diperlukan.
- Fokus hasil diarahkan ke judul/area hasil. Main Lagi harus dapat dijangkau dengan keyboard.
- Animasi pelayanan mengikuti durasi lock pada PRD. Dekorasi tidak boleh menambah penundaan input.

## Pemeriksaan penerimaan UX

Gunakan kasus U01 sampai U16 pada [test plan](05-test-plan.md). Bukti visual harus mencakup tiga layar, viewport target, dan fokus keyboard jika pengambilan screenshot tersedia. Screenshot hanya membuktikan tampilan; kontrol, timer, reset, auto-start, serta penguncian tetap perlu dicoba.
