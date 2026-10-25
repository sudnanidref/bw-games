# Kasir Sat Set

Mini-game kasir warung berbahasa Indonesia, dibuat dengan HTML, CSS, dan JavaScript ES Modules murni. Pemain melayani antrean tiga pembeli selama 20 detik dengan memilih Tunai, EDC, atau QRIS sesuai permintaan orang terdepan. Dari layar awal, game otomatis mulai dalam lima detik jika tombol Mulai tidak ditekan.

## Menjalankan

Prasyarat: Node.js 22.23.3 dan npm 10.9.9. Untuk tipografi identik, install file/font AU Passata berlisensi pada OS/browser sebelum membuka game. Jangan masukkan binary font ke repository kecuali lisensinya secara eksplisit mengizinkan embedding dan redistribusi; CSS siap mengutamakan nama family AU Passata.

```sh
npm install
npm run dev -- --host 127.0.0.1
```

Buka URL yang dicetak Vite. Di lingkungan ini server berjalan di `http://127.0.0.1:5173/`. Hentikan dengan `Ctrl+C` di terminal server.

Perintah lainnya:

```sh
npm ci
npm test
npm run build
npm run preview
```

`npm ci` memasang ulang dari `package-lock.json`. Build produksi dibuat di `dist/`; `npm run preview` menyajikannya secara lokal.

## Cara Bermain

Klik/tap metode pembayaran atau fokuskan tombol dengan Tab lalu aktifkan memakai Enter/Space. Tiga orang anonim mengantre dengan pilihan pembayaran acak yang tetap pada masing-masing orang. Setelah benar, orang terdepan pergi dan antrean maju disertai tanda uang melayang dan bunyi singkat; jawaban salah mengunci pilihan sebentar tanpa mengubah antrean. Main Lagi memulai sesi baru.

## Struktur

- `src/game/config.js`: parameter aturan, countdown, dan metadata pembayaran.
- `src/game/countdown.js`: countdown yang bisa diuji dan dibatalkan.
- `src/game/customers.js`: karakter dan pembentukan customer.
- `src/game/engine.js`: antrean, skor, timer, lock, dan hasil.
- `src/ui/render.js`, `src/ui/input.js`, `src/ui/effects.js`: tampilan, kontrol, dan bunyi sintetis.
- `src/styles.css`: ilustrasi, animasi antrean, responsivitas, dan reduced motion.
- `public/fonts/`: lokasi opsional untuk font AU Passata bila lisensi web embedding tersedia; saat ini file font tidak disediakan.
- `tests/engine.test.js`: tes logika deterministik.
- `docs/verification.md`: hasil pemeriksaan aktual.

Enam dokumen spesifikasi tetap di root proyek: [panduan](00-start-here.md), [PRD](01-product-requirements.md), [UX/UI](02-ux-ui-spec.md), [desain teknis](03-technical-design.md), [rencana implementasi](04-implementation-plan.md), dan [test plan](05-test-plan.md).

Untuk font yang identik, file AU Passata resmi berlisensi harus sudah dipasang lokal di OS/browser. Versi dan weight font harus sama; kode meminta family `AU Passata`/`AU Passata Regular` dan tidak mengunduhnya. Binary font tidak disertakan karena tidak tersedia di workspace dan hak web embedding/redistribusinya belum diketahui.

Tidak ada backend, transaksi sungguhan, penyimpanan skor, CDN, atau aset jaringan. CSS memprioritaskan family `AU Passata`; font binary tidak disertakan karena tidak tersedia di workspace dan lisensi redistribusi/embedding-nya tidak diketahui. Tanpa font terpasang, browser memakai fallback Arial/sans-serif dan hasil tipografi tidak identik. Jangan unduh font dari sumber tak resmi.