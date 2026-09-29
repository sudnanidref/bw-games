# Test Plan dan QA — Kasir Sat Set

Versi 1.2 · Status: rencana pengujian; hasil aktual dicatat di `docs/verification.md`.

Kembali ke [panduan mulai](00-start-here.md). Sumber ekspektasi adalah [PRD](01-product-requirements.md) dan [UX/UI](02-ux-ui-spec.md). Kontrak mesin serta perintah tersedia di [desain teknis](03-technical-design.md).

## Tujuan dan strategi

Periksa kesesuaian perilaku nyata dengan kebutuhan. Jangan membuat tes yang hanya memeriksa nama fungsi atau menyalin implementasi. Tes mesin memakai clock palsu dan RNG terkendali; tes browser memeriksa integrasi UI, event, fokus, dan deadline nyata.

Angka dalam skenario di bawah merupakan hasil yang diharapkan untuk parameter PRD versi ini. Bila PRD berubah, revisi ekspektasi terkait secara sadar; jangan melonggarkan tes hanya agar implementasi yang keliru lulus.

## Persiapan tes

- Mulai setiap kasus dengan mesin/sesi bersih kecuali kasus reset membutuhkan sesi sebelumnya.
- Tetapkan clock awal ke 0 agar waktu skenario berarti waktu relatif sejak Mulai.
- Catat ID pembeli dan sesi dari snapshot yang sedang ditampilkan untuk setiap aksi.
- RNG menerima urutan nilai `[0, 1)` terkontrol. Satu pembeli memakai dua pengambilan: karakter lalu metode.
- Setelah jawaban benar/salah, majukan clock dan panggil pembaruan mesin sebelum mencoba aksi baru yang diharapkan diterima.
- Jangan menunggu durasi nyata dalam tes unit dan jangan membuat pengujian distribusi statistik acak yang tidak stabil.
- Pembersihan setelah setiap tes harus membatalkan loop/listener yang dibuat oleh pengujian integrasi.

## Tes logika otomatis

| ID | Skenario | Hasil yang harus terjadi |
| --- | --- | --- |
| L01 | Sesi baru dimulai | `playing`, skor/hitungan 0, antrean CFG-09 terisi, pembeli pertama aktif, deadline +20.000 ms |
| L02 | Jawaban benar untuk masing-masing metode | +10, pembeli terlayani +1, kesalahan tidak berubah |
| L03 | Jawaban salah pada skor ≥5 | −5, kesalahan +1, pembeli dan permintaan tetap |
| L04 | Salah pada skor 0, lalu benar | Skor akhir 10, terlayani 1, salah 1 |
| L05 | Benar ×3, salah ×1, benar ×2 | Skor 45, terlayani 5, salah 1 |
| L06 | Input selama jeda benar/salah | Tidak mengubah skor, hitungan, atau pembeli |
| L07 | Jeda benar pada 119 ms dan 120 ms | Urutan tetap pada 119; pada 120 pembeli berikutnya menjadi aktif dan satu pembeli baru masuk ekor jika waktu tersisa |
| L08 | Jeda salah pada 499 ms dan 500 ms | Terkunci pada 499; terbuka pada 500, pembeli tetap sama |
| L09 | Pilihan diproses pada 19.999 ms | Diterima jika input terbuka |
| L10 | Pilihan diproses pada 20.000 ms atau sesudahnya | Ditolak dan hasil dibekukan |
| L11 | Waktu habis di tengah lock benar/salah | Hasil langsung selesai; tidak menambah pembeli baru |
| L12 | Jawaban benar sebelum deadline, transisi melewati deadline | Poin benar dihitung; transisi dibatalkan oleh finalisasi |
| L13 | Finalisasi dipanggil berulang | Hasil tetap sama, tanpa efek berulang |
| L14 | Clock meloncat melewati deadline | Langsung selesai tanpa tambahan waktu |
| L15 | RNG pada batas 0, 1/3, 2/3, dan mendekati 1 untuk metode | Pemetaan indeks benar dan tidak keluar dari tiga pilihan |
| L16 | Kombinasi karakter dan metode dikendalikan | Pemilihan independen; karakter sama dapat menerima metode berbeda |
| L17 | Render/update waktu/salah menjelang pergantian | Tidak membuat pembeli atau metode baru di luar aturan |
| L18 | Aksi memakai ID sesi/pembeli lama atau ID pembayaran tidak valid | Tidak mengubah hasil permainan |
| L19 | Main Lagi setelah selesai saat masih ada lock lama | Semua state kembali awal; callback lama tidak memengaruhi sesi baru |
| L20 | Mulai dipanggil ulang ketika sedang bermain | ID sesi, deadline, skor, dan pembeli tidak direset; jumlah loop diperiksa pada U08 |
| L21 | Antrean salah lalu benar | Jawaban salah mempertahankan ID/metode dan urutan; jawaban benar memajukan satu posisi serta mengisi ekor dengan ID baru |
| L22 | Countdown auto-start | Nilai terlihat mulai 5, turun sampai 0, lalu memulai tepat satu sesi |
| L23 | Aktivasi manual selama countdown | Scheduler dibatalkan; sesi tidak dimulai ulang pada deadline countdown lama |

Pada tes berurutan, majukan clock melewati jeda sebelum mengirim pilihan berikutnya. Jangan mengharapkan beberapa pilihan diterima pada waktu yang sama.

Untuk L18, penolakan aksi berarti tidak ada tambahan penilaian akibat aksi tidak valid. Pembaruan waktu yang sah, termasuk finalisasi deadline, tetap boleh terjadi. Untuk L19, coba panggil aksi/callback dengan identitas sesi lama setelah sesi baru dimulai; state sesi baru harus tetap benar.

## Verifikasi browser dan integrasi

Lakukan di browser; gunakan otomatisasi jika alatnya tersedia. Jika tidak tersedia, catat bagian yang belum dapat diverifikasi.

| ID | Pemeriksaan | Kriteria lulus |
| --- | --- | --- |
| U01 | Layar awal | Teks jelas, tiga metode terlihat, Mulai bekerja |
| U02 | Satu sesi tanpa input | Berakhir setelah deadline 20 detik dengan skor 0 |
| U03 | Klik/tap masing-masing metode | Sesuai aturan skor; satu aksi tidak dihitung ganda |
| U04 | Double-click, klik selama lock, dan klik cepat setelah terbuka | Satu aktivasi dinilai sekali; klik selama lock diabaikan; klik baru setelah terbuka tetap dinilai |
| U05 | Keyboard | Tab, Enter, dan Space berfungsi; fokus terlihat; auto-repeat tidak menambah keputusan |
| U06 | Semua ukuran target | Tidak terpotong, tidak tumpang tindih, game dapat dimainkan tanpa scroll |
| U07 | Tab ditinggalkan lebih dari 20 detik | Saat kembali, hasil muncul sebelum input diterima |
| U08 | Main Lagi minimal tiga kali | Seluruh hitungan reset; timer tidak berjalan lebih cepat; listener/loop tidak berlipat |
| U09 | Hasil build produksi | Dapat dibuka melalui server preview dan bermain sampai selesai |
| U10 | Console dan aset | Tidak ada error aplikasi, aset hilang, atau dependensi runtime pada internet eksternal |
| U11 | Preferensi reduced motion | Animasi berkurang dan aturan waktu/input tetap sama |
| U12 | Akhir sesi dan feedback | Hasil cocok dengan keputusan yang dilakukan; kontrol pembayaran sudah tidak aktif |
| U13 | Antrean pembeli | Tiga orang terlihat berjalan; setiap orang membawa token metode tetap; setelah jawaban benar orang berikutnya maju, sedangkan jawaban salah mempertahankan urutan |
| U14 | Layar awal dan auto-start | Hanya judul, tiga nilai skor, metode, tombol, dan countdown yang tampil; klik manual membatalkan timer dan diam selama 5 detik memulai satu sesi |
| U15 | Efek dan anonimitas | Jawaban benar menampilkan tanda `$` dan bunyi “cring”; jawaban salah tidak; tidak ada nama/nomor pembeli yang tampil |
| U16 | Font dan palet | `AU Passata` termuat dari file lokal berlisensi; palet blue/white/yellow dan kontras cocok dengan UX spec |

Target browser adalah versi stabil Chrome/Edge, Firefox, dan Safari, termasuk browser ponsel yang relevan. Catat browser yang benar-benar diuji; jangan mengklaim semua target terverifikasi jika hanya satu yang tersedia.

Pada U05, lakukan juga permainan satu sesi hanya dengan keyboard dan pastikan fokus dapat dilanjutkan setelah lock. Pada U06, periksa kontras, ukuran area tekan, pemotongan teks, dan urutan tombol sesuai UX/UI. Pada U09, periksa instalasi ulang dari lockfile serta build melalui perintah yang didokumentasikan.

## Matriks keterlacakan

| Kebutuhan PRD | Pemeriksaan yang membuktikan |
| --- | --- |
| FR-01 Pembayaran | L02, L18, U01, U03 |
| FR-02 Pembeli dan randomisasi | L01, L07, L15, L16, L17, U06 |
| FR-03 Waktu sesi | L09–L14, U02, U07 |
| FR-04 Skor dan statistik | L02–L05, L10, L12, L18, U03, U12 |
| FR-05 Pelayanan dan feedback | L03, L06–L08, L11, U03, U04, U12 |
| FR-06 Kontrol dan keputusan | L06, L18, U03–U05 |
| FR-07 Siklus sesi | L01, L13, L19, L20, U01, U08, U12 |
| FR-08 Layar dan hasil | U01, U02, U06, U12 |
| FR-09 Lintas perangkat | U03, U05, U06, U11 |
| FR-10 Batas sistem dan kualitas | U09, U10, U16, pemeriksaan kode dan berkas serah terima |

Pemeriksaan U06 juga memastikan jumlah variasi karakter memenuhi PRD, melalui data/aset dan tampilan representatif. Jangan mengandalkan kebetulan semua karakter muncul dalam satu sesi acak.

## Urutan eksekusi QA

1. Jalankan tes otomatis sekali sampai selesai.
2. Jalankan build produksi.
3. Jalankan preview dari hasil build.
4. Coba tiga layar, keputusan benar/salah, sesi tanpa input, dan Main Lagi.
5. Jalankan pemeriksaan input, viewport, aksesibilitas, tab latar belakang, serta pengulangan sesi.
6. Periksa console, pemuatan aset, permintaan jaringan eksternal, dan berkas proyek.
7. Perbaiki kegagalan, lalu ulangi pemeriksaan yang terdampak.
8. Catat hasil nyata pada `docs/verification.md` di proyek implementasi.

Tidak boleh mencatat rencana tes sebagai hasil tes yang sudah dijalankan.

## Format laporan verifikasi

AI agent membuat laporan aktual setelah implementasi, memuat:

- Tanggal pemeriksaan dan revisi kode jika tersedia.
- Lingkungan: OS, Node.js, package manager, browser, dan viewport yang digunakan.
- Perintah instalasi, tes, build, preview, exit status, serta ringkasan hasil.
- Tabel dengan kolom `ID pemeriksaan | PASS / FAIL / NOT RUN | Bukti | Catatan`.
- Tautan screenshot/log yang benar-benar tersedia.
- Daftar masalah terbuka, dampaknya, serta langkah reproduksi.
- Kesimpulan status: selesai atau implementasi tersedia dengan verifikasi belum lengkap.

Catat pemeriksaan yang tidak tersedia sebagai NOT RUN beserta alasannya. Jangan mengubahnya menjadi PASS berdasarkan dugaan.

## Kriteria keluar QA

- Semua tes logika wajib lulus dan build produksi berhasil.
- Perilaku inti, input, hasil, serta pengulangan sesi telah dicoba di browser.
- Seluruh viewport target telah diperiksa dan tidak memiliki hambatan bermain.
- Tidak ada cacat aturan skor/timer, kehilangan input yang sah, error aplikasi, atau aset rusak yang belum diselesaikan.
- Browser yang tersedia dan yang belum diuji disebutkan secara jelas. Dukungan pada browser yang belum diuji tidak boleh dinyatakan telah terverifikasi.
- Bila pemeriksaan wajib belum dapat dilakukan, serahkan hasil dan daftar sisa pemeriksaan dengan status verifikasi belum lengkap.
