# Laporan Verifikasi

Tanggal: 2026-09-29  
Status: **implementasi tersedia, verifikasi belum lengkap**

## Lingkungan

- OS: macOS
- Node.js: `v22.23.3`
- npm: `10.9.9`
- Vite: `6.4.3`
- Vitest: `5.0.2`
- Browser: browser terintegrasi VS Code; nama/versi engine tidak diekspos oleh alat
- Viewport game: `360×640`, `390×844`, `844×390`, `1366×768`
- Font: stack CSS `AU Passata`; file font tidak ditemukan di workspace atau indeks font lokal macOS. Preview memakai fallback Arial/sans-serif.

## Pemeriksaan

| ID pemeriksaan | Status | Bukti | Catatan |
| --- | --- | --- | --- |
| Install | PASS | `npm install` dan `npm ci` berhasil dari `package-lock.json` | `npm audit` melaporkan 0 vulnerabilities dengan Vitest 5.0.2 |
| L01–L23 | PASS | `npm test`: 19 tes lulus | Clock/RNG/scheduler deterministik; mencakup antrean, skor, lock, deadline, replay, auto-start, dan pembatalannya |
| Build | PASS | `npm run build`: Vite menghasilkan `dist/` | Build lokal sukses |
| U01 | PASS | Layar awal menampilkan hanya judul, nilai poin, tiga metode, Mulai, dan countdown | Deskripsi lain dan masthead dihapus |
| U03 | PASS | Pointer nyata memilih metode benar (+10) dan salah (−5) | Skor, feedback, serta lock terlihat di UI |
| U04 | PASS | Klik kedua selama lock salah tidak menambah skor/kesalahan | Antrean tidak bergeser saat salah |
| U05 | PASS | Enter mengaktifkan tombol pembayaran yang fokus; fokus tetap pada tombol saat lock | Pengulangan key auto-repeat tidak diuji khusus |
| U06 | PASS | Landing diukur pada `360×640`, `390×844`, `738×1006`, `844×390`, `1366×768`; game diukur pada viewport target tanpa scroll | Tombol game terukur minimal 54 px di landscape; teks request, counter, metode, dan ikon QR memiliki kontras minimal 5.65:1 pada sampel terukur |
| U09 | PASS | Build dibuka pada `http://127.0.0.1:4173/` dan tiga siklus hasil/replay berjalan | Preview produksi berasal dari `dist/` |
| U10 | PASS | Tidak ada page error/console error; resource origins hanya `http://127.0.0.1:4173` | Browser tidak menampilkan versi engine |
| U11 | PASS | Browser disetel ke reduced motion; computed animation dan transition menjadi `0.00001s` | Deadline game tidak berubah |
| U12 | PASS | Hasil waktu habis menampilkan skor/statistik dan memfokuskan judul hasil | Sesi berakhir sesuai deadline logis |
| U13 | PASS | Tiga customer anonim tampak; metode per orang tetap; jawaban benar menggeser FIFO | Tidak ada nama atau nomor identitas yang dirender |
| U14 | PASS | Countdown tampil `5 → 4`; klik manual sebelum habis mempertahankan satu sesi; tanpa klik memulai otomatis pada detik kelima | Timer awal game tetap `00:20` dan skor nol |
| U15 | PASS | Jawaban benar memberi 10 poin, tiga floater `$`, dan satu oscillator Web Audio; label customer tidak beridentitas | Bunyi disintesis lokal; jawaban salah tidak memicu efek sesuai guard perubahan feedback benar |
| U16 | NOT RUN | CSS meminta `AU Passata`, tetapi font binary tidak tersedia di mesin ini | Pemeriksaan visual yang identik memerlukan file resmi berlisensi; fallback tidak dianggap lulus |
| U16 | NOT RUN | Stack CSS meminta `AU Passata`, tetapi file/family font tidak tersedia di workspace atau font lokal yang terindeks pada macOS ini | Browser memakai fallback; reproduksi bentuk huruf identik menunggu file resmi berlisensi. Warna/palet dan stack family telah diperiksa |
| U02 | PASS | Sesi tanpa input ditunggu 20 detik di dev server | Hasil skor 0 muncul saat deadline |
| U07 | NOT RUN | Tab tidak ditinggalkan lebih dari 20 detik | Clock logic dan pemanggilan `visibilitychange` diperiksa terpisah |
| U08 | PASS | Tiga siklus deadline/replay di preview produksi dengan clock browser terkontrol | Setiap replay kembali ke `00:20`, skor 0, tiga customer, tanpa node antrean lama atau scroll |

## Perintah dan hasil

- `npm install`: berhasil; lockfile tersedia.
- `npm test`: berhasil; 1 test file, 19 tes lulus.
- `npm run build`: berhasil; output produksi tersedia di `dist/`.
- `npm audit`: berhasil; 0 vulnerabilities.
- Dev server: berhasil di `http://127.0.0.1:5173/`.
- Preview produksi: berhasil di `http://127.0.0.1:4173/`; aset dimuat dari origin lokal saja.

## Pemeriksaan tersisa

- Verifikasi tab latar belakang dengan benar-benar menyembunyikan tab lebih dari 20 detik.
- Pemeriksaan kontras mencakup sampel utama, bukan audit manual atas setiap teks dekoratif.
- Browser selain browser terintegrasi VS Code belum diuji.
- AU Passata belum dapat diverifikasi secara visual karena file font berlisensi tidak tersedia; jangan menganggap fallback Arial sebagai hasil tipografi final.