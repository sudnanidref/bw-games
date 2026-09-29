# Implementation Plan — Kasir Sat Set

Versi 1.2 · Status: rencana kerja; belum menandakan implementasi selesai.

Kembali ke [panduan mulai](00-start-here.md). Urutan kerja ini menjalankan [PRD](01-product-requirements.md), [UX/UI](02-ux-ui-spec.md), dan [desain teknis](03-technical-design.md). Validasi merujuk [test plan](05-test-plan.md).

## Cara menggunakan

Kerjakan tahap sesuai dependensi. Selesaikan bagian yang bisa dikerjakan tanpa menunggu keputusan tambahan jika default sudah tersedia. Setiap tahap harus menghasilkan berkas atau perilaku yang dapat diperiksa.

Checklist di bawah adalah status tugas implementasi, bukan status penulisan dokumen. Tandai selesai hanya setelah hasil tahapnya benar-benar tersedia.

## Tahap kerja

| ID | Tahap | Dependensi | Hasil konkret | Syarat menyelesaikan tahap |
| --- | --- | --- | --- | --- |
| TASK-01 | Periksa lingkungan dan susun proyek | Semua dokumen dibaca | Folder kerja, stack/package manager, struktur awal, perintah proyek | Proyek dapat diinstal dan dijalankan; file lain tetap terpelihara |
| TASK-02 | Konfigurasi dan data pembeli | TASK-01 | Parameter PRD, antrean customer, metadata pembayaran, data karakter, RNG yang dapat diganti | Enum/urutan benar, queueSize terjaga, jumlah karakter memenuhi PRD, sampling independen |
| TASK-03 | Mesin permainan | TASK-02 | State, kontrak modul, clock/deadline, skor, lock, reset, finalisasi | Alur utama serta batas waktu dapat dijalankan tanpa DOM |
| TASK-04 | Tes logika | TASK-03 | Tes L01–L23 dengan clock/RNG/scheduler terkontrol | Semua tes lulus; tidak mengandalkan delay nyata atau sampel acak |
| TASK-05 | Tiga layar dan aset | TASK-01, TASK-02 | Layar awal ringkas dengan countdown, AU Passata, bermain, hasil, ilustrasi, antrean berjalan, efek sukses, layout responsif | Seluruh elemen UX tersedia dan memakai data yang benar; lisensi/keberadaan font dicatat |
| TASK-06 | Integrasi kontrol dan lifecycle | TASK-03, TASK-05 | Klik/tap/keyboard, fokus, auto-start yang dapat dibatalkan, pergeseran antrean, satu loop, visibility, replay | Bisa bermain sampai hasil dan mengulang tanpa input ganda |
| TASK-07 | Pemeriksaan browser dan perbaikan | TASK-04, TASK-06 | U01–U16, perbaikan tampilan dan perilaku, bukti yang tersedia | Tidak ada kegagalan aturan/UX yang belum diselesaikan; keterbatasan dicatat |
| TASK-08 | Build dan serah terima | TASK-07 | Build produksi, README operasional, laporan aktual, pratinjau lokal | Build/preview berjalan; hasil dan status verifikasi dilaporkan jujur |

Tahap visual dapat dikerjakan setelah data tersedia sambil logika dikembangkan secara bertahap. Hal ini tidak mewajibkan pemakaian sub-agent atau pembagian pekerjaan ke agent lain.

## Checklist pelaksanaan

- [ ] TASK-01: lingkungan dan struktur siap.
- [ ] TASK-02: konfigurasi dan data siap.
- [ ] TASK-03: mesin berjalan sesuai kontrak.
- [ ] TASK-04: tes logika lulus.
- [ ] TASK-05: seluruh layar dan aset tersedia.
- [ ] TASK-06: interaksi dan siklus sesi tersambung.
- [ ] TASK-07: pemeriksaan browser selesai dan masalah ditangani.
- [ ] TASK-08: build, dokumentasi, dan serah terima selesai.

## Petunjuk implementasi per tahap

### Fondasi

Jika pengguna menentukan folder proyek, gunakan folder itu. Jika ada proyek relevan, gunakan strukturnya. Jika belum ada, buat `kasir-sat-set/` di workspace yang diberikan. Simpan enam dokumen acuan di `docs/` pada proyek implementasi agar tautan relatif tetap bekerja.

Gunakan alat yang tersedia di lingkungan. Tidak perlu menunggu layanan gambar: SVG/CSS lokal adalah jalur default yang sudah ditentukan. AU Passata harus berasal dari file/font resmi berlisensi yang disediakan untuk proyek; jangan menyalin atau mengunduh font dari sumber tidak resmi.

Untuk tampilan identik, pastikan font AU Passata legal tersedia pada browser target. Jangan mengunduh, menyertakan, atau meng-embed file font tanpa lisensi web yang sesuai; catat fallback Arial sebagai keterbatasan jika font tidak tersedia.

### Logika

Bangun alur minimal: Mulai → pembeli → jawaban → lock → pembeli berikutnya/ulang pilihan → hasil. Setelah itu periksa deadline, aksi lama, reset, serta finalisasi berulang. Jangan membiarkan animasi UI menentukan kapan skor dihitung.

### Antarmuka

Mulai dari viewport ponsel kecil, lalu sesuaikan desktop dan landscape. Label, waktu, skor, serta area tekan diprioritaskan dibanding dekorasi. Hubungkan semua layar ke state yang sama; jangan meninggalkan hasil atau skor contoh.

### Verifikasi

Jalankan tes logika dan build, kemudian uji hasil produksi melalui preview. Cocokkan alur yang benar-benar terjadi dengan skenario QA. Perbaiki penyebab kegagalan sebelum memperluas fitur. Jangan menambahkan fitur baru untuk menghindari aturan yang sulit diterapkan.

## Berkas serah terima

- Kode sumber dan seluruh aset lokal.
- Manifest dependensi dan satu lockfile.
- Tes logika yang bisa dijalankan ulang.
- Enam dokumen spesifikasi dalam folder `docs/`.
- README operasional pada root proyek implementasi.
- `docs/verification.md` berisi hasil aktual dan keterbatasan.
- Jika tersedia, screenshot tiga layar dan viewport target di `docs/screenshots/`.

Jangan menyertakan `node_modules/`, cache, file sementara, atau kredensial. Build harus dapat dihasilkan ulang dari sumber. Deployment publik bukan bagian tahap ini kecuali pengguna meminta secara eksplisit.

## Isi README operasional setelah implementasi

1. Ringkasan game dan kontrol mouse, sentuhan, serta keyboard.
2. Prasyarat dan versi runtime/package manager yang benar-benar digunakan.
3. Instalasi pertama dan instalasi ulang dari lockfile.
4. Perintah menjalankan, tes, build, serta preview.
5. Alamat lokal yang benar-benar ditampilkan server dan cara menghentikannya.
6. Ringkasan struktur proyek serta lokasi parameter.
7. Tautan dokumentasi dan laporan verifikasi.
8. Keterbatasan yang masih ada.

## Penanganan hambatan

- Jika instalasi gagal, periksa error dan lakukan perbaikan yang sesuai dengan lingkungan yang diizinkan.
- Jika browser atau perangkat tertentu tidak tersedia, lanjutkan implementasi serta pemeriksaan lain; beri status NOT RUN pada pemeriksaan tersebut.
- Jika masalah merupakan detail teknis rutin, pilih solusi yang tetap memenuhi spesifikasi dan catat keputusan.
- Jika benar-benar ada konflik aturan produk yang tidak bisa diselesaikan dari dokumen dan instruksi pengguna, minta klarifikasi spesifik sambil melanjutkan bagian independen.
- Jangan mengganti requirement inti, menghapus tes yang gagal, atau mengklaim pekerjaan selesai untuk menghindari hambatan.

## Ringkasan akhir untuk pengguna

Laporkan lokasi proyek/pratinjau, cara menjalankan, fitur yang selesai, hasil pemeriksaan aktual, serta keterbatasan. Jika pemeriksaan wajib belum dilakukan, gunakan status verifikasi belum lengkap sebagaimana diatur panduan mulai.
