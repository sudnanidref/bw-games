# Technical Design — Kasir Sat Set

Versi 1.2 · Status: rancangan implementasi dan kontrak modul internal.

Kembali ke [panduan mulai](00-start-here.md). Dokumen ini menjelaskan cara memenuhi [PRD](01-product-requirements.md) dan [UX/UI](02-ux-ui-spec.md). Nilai parameter tetap dimiliki PRD, sedangkan hasil yang harus dibuktikan tercantum pada [test plan](05-test-plan.md).

## Keputusan arsitektur

| Keputusan | Pilihan | Alasan |
| --- | --- | --- |
| Runtime produk | Aplikasi browser satu halaman | Interaksi sederhana dengan tiga layar |
| Proyek baru | Vite, JavaScript ES Modules, HTML, CSS | Struktur ringan tanpa kebutuhan framework/game engine |
| Tes logika | Vitest | Mesin dapat diperiksa tanpa browser nyata |
| State | Satu mesin permainan dalam memori | Menjaga skor, deadline, dan sesi konsisten |
| Aset | SVG/CSS lokal, Web Audio, dan font AU Passata lokal berlisensi | Tidak ada CDN atau aset jaringan saat runtime |
| Backend/API jaringan | Tidak ada | Tidak ada kebutuhan akun, transaksi, atau penyimpanan daring |

Jika proyek relevan sudah ada, pertahankan stack, package manager, alat tes, dan struktur yang digunakan. Jangan melakukan migrasi tanpa kebutuhan. Dokumentasikan penyesuaian teknis, tetap pertahankan seluruh perilaku produk.

Untuk proyek baru, gunakan versi dependensi stabil dan kompatibel yang tersedia ketika implementasi berlangsung. Simpan lockfile, gunakan satu package manager, dan catat versi Node.js aktual. Jangan menebak versi paket terbaru di dokumentasi hasil.

## Struktur proyek acuan

```text
kasir-sat-set/
  index.html
  package.json
  package-lock.json
  .gitignore
  README.md
  docs/
    00-start-here.md
    01-product-requirements.md
    02-ux-ui-spec.md
    03-technical-design.md
    04-implementation-plan.md
    05-test-plan.md
    verification.md          # dibuat setelah pemeriksaan aktual
  src/
    main.js
    styles.css
    game/
      config.js
      countdown.js
      customers.js
      engine.js
    ui/
      effects.js
      render.js
      input.js
    assets/                  # bila aset vektor dieksternalisasi
  public/fonts/              # AU Passata lokal hanya jika lisensi mengizinkan web embedding
  tests/
    engine.test.js
```

Nama file boleh disesuaikan pada proyek yang sudah ada. Hindari perubahan di luar lingkup. Pisahkan hasil build `dist/`, dependensi `node_modules/`, dan cache dari kode sumber yang diserahkan.

## Pembagian tanggung jawab

| Bagian | Tanggung jawab | Batasan |
| --- | --- | --- |
| `config.js` | Menyimpan parameter PRD dan daftar ID pembayaran | Satu salinan nilai runtime |
| `countdown.js` | Menghitung auto-start layar awal dari 5 ke 0 | Clock/scheduler dapat diinjeksi; cancel idempotent |
| `customers.js` | Data variasi karakter serta pembentukan pembeli acak | Tidak menghitung skor atau memanipulasi DOM |
| `engine.js` | Sesi, skor, lock, deadline, hasil, reset | Tidak bergantung pada browser/DOM |
| `input.js` | Mouse, sentuhan, keyboard, identitas aksi | Tidak menerapkan aturan skor sendiri |
| `render.js` | Menyajikan snapshot state dan copy UX | Tidak mengacak pembeli saat render |
| `effects.js` | Bunyi “cring” sintetis untuk jawaban benar | Web Audio lokal; tidak ada file/CDN |
| `main.js` | Inisialisasi, loop, fokus/visibility, cleanup | Satu pemilik loop aktif |
| `styles.css` | Layout, karakter/dekorasi, fokus, reduced motion | Tidak mengubah durasi logis |

Alur data:

```text
Aktivasi pemain → adaptor input → mesin permainan → snapshot → tampilan
Clock → satu loop pembaruan ────────┘
RNG → pembentukan pembeli ──────────┘
```

## Konfigurasi

Implementasikan semua key pada [tabel parameter PRD](01-product-requirements.md#parameter-produk) di satu objek konfigurasi yang tidak dimutasi saat sesi berjalan. Gunakan urutan ID pembayaran dari PRD FR-01. CSS memakai family stack `'AU Passata', 'AU Passata Regular', Arial, sans-serif`; font tidak diambil dari CDN.

UI mengambil angka aturan dari objek yang sama. Turunkan `durationSeconds` dari `durationMs`; jangan menyimpan nilai timer terpisah untuk teks instruksi. Jumlah data karakter minimal `minimumCharacterCount`.

Layar awal memakai `autoStartMs` untuk menampilkan countdown dan memulai tepat satu sesi bila tidak ada aktivasi manual. Aktivasi tombol membatalkan scheduler. Efek suara benar disintesis melalui Web Audio API setelah keputusan benar; tidak ada file suara atau aset jarak jauh. Untuk reproduksi visual identik, sediakan font AU Passata lokal yang berlisensi; tanpa file itu preview memakai fallback Arial.

Token visual acuan di `src/styles.css`: `--ink #152F4D`, `--ink-soft #415D79`, `--paper #F8FAFC`, `--paper-deep #E9F0F7`, `--green #00549A` (primary blue), `--green-dark #003E73`, `--green-light #E1EFFB`, `--orange #F2B928` (yellow accent), `--orange-dark #815600`, `--muted-dark #465E77`, `--yellow #FFC629`, `--blue #00549A`. Canvas body memakai #EAF2FA dengan pola titik lokal.

## Model data

```text
PaymentId = cash | edc | qris
Character = { id, ...atributVisual }
Customer = { id, characterId, paymentId }

GameState = {
  phase: ready | playing | result,
  roundId,
  score,
  servedCount,
  wrongCount,
  customerQueue: Customer[],
  startedAt: number | null,
  deadline: number | null,
  lockUntil: number,
  lockReason: none | correct | wrong,
  feedback: none | correct | wrong
}
```

Sebelum sesi pertama: phase `ready`, skor/hitungan nol, `customerQueue` kosong, `startedAt`, dan `deadline` bernilai null, serta tanpa feedback atau lock. Saat mulai, isi antrean sampai `config.queueSize`; `currentCustomer` merupakan turunan `customerQueue[0]`, bukan salinan state kedua. Hanya pembeli terdepan yang aktif. ID semua pembeli harus unik dalam satu sesi; pasangan `roundId` dan ID pembeli mengidentifikasi target aksi lintas sesi.

`remainingMs`, detik tampilan, dan status kontrol boleh diturunkan dari state. Jangan menyimpan salinan independen yang dapat berbeda dengan skor atau deadline mesin. Snapshot untuk UI/test tidak boleh dapat digunakan untuk memutasi state internal secara tidak sengaja.

## Kontrak modul internal

Tidak ada endpoint HTTP atau API spec jaringan pada versi ini. Tabel berikut merupakan kontrak internal yang cukup untuk menghubungkan UI dan logika.

| Operasi | Masukan | Hasil/perilaku |
| --- | --- | --- |
| `createGame({ clock, rng, config, characters })` | Dependensi clock monotonik dan RNG; konfigurasi/data | Mesin dengan state awal `ready` |
| `startRound()` | Tidak ada | Mulai dari `ready`/`result`; jika `playing`, abaikan tanpa reset |
| `advance()` | Tidak ada; membaca clock internal | Periksa deadline, finalisasi atau selesaikan lock, lalu kembalikan snapshot |
| `selectPayment({ paymentId, roundId, customerId })` | Aksi untuk pembeli yang ditampilkan | Periksa waktu serta guard, terapkan paling banyak satu keputusan, kembalikan snapshot |
| `getSnapshot()` | Tidak ada | Salinan state terakhir dan nilai tampilan; tanpa RNG/penilaian/transisi |

Nama metode boleh disesuaikan, tetapi kontraknya harus terpelihara. `advance()` dipanggil loop dan sebelum pemrosesan pilihan. UI tidak boleh mengirim timestamp untuk memperpanjang kelayakan jawaban; clock berasal dari mesin. `getSnapshot()` tidak menggantikan pemeriksaan deadline pada jalur input.

ID pembayaran tidak valid, identitas sesi/pembeli lama, dan aksi saat tidak bermain diabaikan tanpa penalti. Pembaruan waktu yang sah tetap diperbolehkan sebelum suatu aksi ditolak.

## Clock, deadline, dan loop

Gunakan clock monotonik, misalnya `performance.now()`, dengan dependensi yang bisa diganti saat tes.

```text
startedAt = clock()
deadline = startedAt + config.durationMs
remainingMs = max(0, deadline - clock())
displaySeconds = ceil(remainingMs / 1000)
```

Rumus sisa waktu digunakan ketika `playing`. Sebelum mulai, nilai tampilan waktu adalah `config.durationMs`; setelah `result`, nilainya 0. Jangan menghitung selisih dari deadline null.

- Siapkan layar dan aset sebelum sesi menerima input. Tetapkan waktu mulai ketika layar permainan siap digunakan.
- Gunakan satu loop, misalnya `requestAnimationFrame`, untuk memanggil `advance()` dan memperbarui tampilan.
- Interval/render bukan sumber kebenaran timer. Jangan mengurangi penghitung detik secara bertahap sebagai satu-satunya pengukuran waktu.
- Pada `visibilitychange` ketika aktif kembali, panggil pembaruan sebelum membuka interaksi.
- Pada deadline, masuk `result`, batalkan transisi tertunda, hapus lock/feedback, bekukan statistik, dan hentikan loop bermain.
- Finalisasi harus idempotent: pemanggilan tambahan tidak mengubah hasil atau memicu efek tambahan.
- Tidak perlu timeout terpisah untuk lock; simpan waktu berakhir dan evaluasi pada pembaruan. Jika memakai callback tertunda, periksa identitas sesi sebelum berpengaruh.

## Randomisasi

Gunakan `Math.floor(rng() * jumlahPilihan)` dengan nilai RNG pada `[0, 1)`. Saat membuat pembeli, ambil RNG untuk karakter terlebih dahulu, lalu ambil RNG terpisah untuk metode. Produksi boleh memakai `Math.random`; tes memakai urutan terkontrol.

RNG hanya dipanggil ketika pembeli baru memang diperlukan menurut PRD. Variasi visual statis tidak boleh mengambil RNG tambahan yang mengubah urutan pengambilan metode secara tersembunyi.

## Countdown dan efek antarmuka

`countdown.js` menerima `clock`, `schedule`, dan `cancel` agar hitung mundur dapat diuji tanpa delay nyata. Input mengikat satu scheduler pada layar `ready`, memperbarui hitungan dari 5 ke 0, lalu memanggil `startRound()` satu kali. Klik manual membatalkan scheduler sebelum start; panggilan saat fase `playing` tidak membuat round/loop baru.

`effects.js` membuat oscillator sine 1320→1760→1320 Hz dengan gain puncak 0.16 selama 370 ms. Renderer hanya memanggilnya ketika feedback berubah ke `correct` dan menambah tiga elemen `$` pada posisi 43/56/69% selama 850 ms. Salah/aksi invalid tidak memicu efek. Motion mengikuti `prefers-reduced-motion`; durasi sesi dan lock tetap memakai CFG-05/06.

## Urutan keputusan

Semua referensi `config` pada pseudocode berikut berasal dari PRD. Parameter `now` merepresentasikan satu pembacaan clock di dalam mesin, bukan waktu yang ditentukan pengguna atau UI.

Pseudocode berikut menjelaskan urutan wajib; struktur kodenya boleh berbeda.

```text
advance(now):
  if phase != playing: return
  if now >= deadline:
    finishRoundOnce()
    return
  if lockReason != none and now >= lockUntil:
    if lockReason == correct:
      remove customerQueue[0]
      append createRandomCustomerWithNewId()
    lockReason = none
    feedback = none

select(paymentId, expectedRoundId, expectedCustomerId, now):
  advance(now)
  if phase != playing: return
  if expectedRoundId != roundId: return
  if expectedCustomerId != customerQueue[0].id: return
  if paymentId not in [cash, edc, qris]: return
  if lockReason != none: return

  if paymentId == customerQueue[0].paymentId:
    score += config.correctPoints
    servedCount += 1
    feedback = correct
    lockReason = correct
    lockUntil = now + config.correctTransitionMs
  else:
    score = max(config.minimumScore, score - config.wrongPenalty)
    wrongCount += 1
    feedback = wrong
    lockReason = wrong
    lockUntil = now + config.wrongLockMs
```

Saat akhir lock benar menghasilkan pembeli baru, render pembeli tersebut sebelum UI mengirim aksi dengan identitas barunya. Jika aksi masih memakai ID pembeli lama, abaikan. Hal ini mencegah klik untuk tampilan lama menilai pembeli yang belum dilihat pemain.

## Integrasi input dan fokus

- Pakai tombol HTML asli. Jalur penilaian hanya satu, umumnya `click`; handler pointer/keyboard tambahan hanya untuk pencatatan konteks, pencegahan repeat, atau aksesibilitas.
- Simpan konteks sesi/pembeli yang ditampilkan ketika gesture dimulai dan bawa konteks itu ke aksi. Jangan mengganti target aksi tertunda dengan pembeli terbaru ketika tombol dilepas.
- Gesture yang dimulai ketika input terkunci harus dibuang; pelepasan setelah lock berakhir tidak boleh mengantrekkan jawaban lama.
- Aktivasi keyboard/assistive technology yang tidak memiliki pointer tetap didukung dengan konteks tampilan yang aktif.
- Jangan menilai lagi pada `dblclick`. Klik fisik terpisah tetap mengikuti guard biasa.
- Tolak keyboard auto-repeat tanpa mematikan aktivasi Enter/Space normal.
- Semua jalur penilaian mengecek lock di mesin. Keadaan disabled di UI saja tidak cukup.
- Kelola fokus mengikuti UX/UI. Jika memakai `aria-disabled` untuk mempertahankan fokus, tetap cegah aktivasi pada seluruh jalur input saat terkunci.
- UI diperbarui tanpa membuat ulang semua elemen setiap frame; pertahankan identitas kontrol dan urutan Tab.
- Ketika sesi selesai atau diulang, hentikan loop lama dan bersihkan callback/listener yang tidak digunakan. Listener yang dipertahankan harus membaca konteks sesi yang benar tanpa terdaftar ganda.

## Perintah proyek baru

| Perintah | Kontrak |
| --- | --- |
| `npm install` | Instalasi pertama yang menghasilkan lockfile konsisten |
| `npm ci` | Instalasi ulang dari lockfile |
| `npm run dev` | Menjalankan server pengembangan lokal |
| `npm test` | Menjalankan tes satu kali, tanpa watch |
| `npm run build` | Membuat build produksi ke `dist/` |
| `npm run preview` | Menjalankan server untuk hasil build produksi |

Script npm proyek baru: `dev = vite`, `test = vitest run`, `build = vite build`, dan `preview = vite preview`. Versi ter-resolve pada lockfile proyek ini: Vite 6.4.3, Vitest 5.0.2; runtime yang diverifikasi Node.js 22.23.3 dan npm 10.9.9. Manifest memakai rentang kompatibel Vite `^6.3.5` dan Vitest `^5.0.2`; `package-lock.json` mengunci versi persis. Jika memakai proyek yang sudah ada, gunakan padanan dan dokumentasikan perbedaannya.

Tidak diperlukan API key, variabel rahasia, konfigurasi pembayaran, atau akun layanan. Membuka `index.html` langsung melalui file manager bukan jalur menjalankan yang didokumentasikan; gunakan server lokal.

## Kualitas dan serah terima

- Semua dependensi dan aset runtime harus tersedia melalui proyek lokal, tanpa CDN.
- Tidak ada import rusak, nilai skor palsu, listener ganda, atau error aplikasi.
- Jangan menambahkan backend, penyimpanan, atau fitur yang dikeluarkan PRD.
- Hasil serah terima meliputi kode, aset, lockfile, tes, README operasional, dokumen ini beserta lima dokumen lain, dan laporan verifikasi aktual.
- README paket brief saat ini menjelaskan pemakaian dokumentasi. README proyek yang diimplementasikan harus menjelaskan pengoperasian game; petunjuk eksekusi brief tetap tersedia pada `docs/00-start-here.md`.
- Ikuti [implementation plan](04-implementation-plan.md) dan laporkan keterbatasan sesuai [test plan](05-test-plan.md).
