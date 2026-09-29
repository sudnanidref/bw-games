# Product Requirements — Kasir Sat Set

Versi 1.2 · Status: acuan produk untuk implementasi · BRD dan PRD digabung.

Kembali ke [panduan mulai](00-start-here.md). Dokumen ini memiliki kewenangan atas tujuan, lingkup, aturan permainan, dan nilai parameter. Desain tampilan terdapat pada [UX/UI](02-ux-ui-spec.md), implementasi pada [desain teknis](03-technical-design.md), dan pembuktiannya pada [test plan](05-test-plan.md).

## Konteks bisnis dan tujuan

Kasir Sat Set adalah mini-game bertema accountability. Pemain menjadi kasir warung yang mencocokkan permintaan pembayaran pembeli dengan pilihan yang benar dalam sesi singkat.

Tujuan pengalaman ini adalah memperlihatkan hubungan antara memperhatikan permintaan, mengambil keputusan, dan menerima konsekuensi hasil keputusan. Kecepatan serta ketepatan sama-sama memengaruhi hasil. Skor merepresentasikan performa dalam game, bukan penilaian kepribadian atau integritas.

Pengguna utama adalah pemain yang mengakses game melalui browser desktop atau ponsel. Tidak ada asumsi khusus mengenai perusahaan, kelompok usia, program pelatihan, monetisasi, atau jumlah pengguna.

Keberhasilan versi awal dinilai dari alur yang bisa dimainkan sampai selesai, aturan yang konsisten, kontrol yang dapat digunakan, dan pemeriksaan yang lulus. Target retensi, peningkatan pembelajaran, pendapatan, serta metrik bisnis lain belum ditetapkan dan bukan persyaratan rilis ini.

## Lingkup hasil

Satu web game berbahasa Indonesia, satu pemain, satu mode permainan, tanpa backend. Hasil implementasi mencakup kode sumber, aset lokal, tes, build, README operasional, dan laporan verifikasi. Pemain dapat memulai, bermain, melihat hasil, dan langsung bermain lagi.

## Parameter produk

Tabel ini adalah sumber utama nilai parameter. Dokumen teknis merujuk key yang sama. Angka dalam contoh pengujian merupakan turunan dari tabel ini, bukan aturan terpisah.

| ID | Key konfigurasi | Nilai | Makna |
| --- | --- | --- | --- |
| CFG-01 | `durationMs` | 20000 ms | Durasi satu sesi |
| CFG-02 | `correctPoints` | 10 | Poin per pilihan benar |
| CFG-03 | `wrongPenalty` | 5 | Pengurangan per pilihan salah |
| CFG-04 | `minimumScore` | 0 | Batas bawah skor setelah setiap keputusan |
| CFG-05 | `correctTransitionMs` | 120 ms | Jeda input dan pergantian setelah benar |
| CFG-06 | `wrongLockMs` | 500 ms | Jeda input setelah salah |
| CFG-07 | `urgentTimeMs` | 3000 ms | Ambang penekanan visual sisa waktu |
| CFG-08 | `minimumCharacterCount` | 6 | Jumlah minimal variasi karakter |
| CFG-09 | `queueSize` | 3 | Jumlah pembeli yang terlihat dalam antrean, termasuk pembeli di kasir |
| CFG-10 | `autoStartMs` | 5000 ms | Waktu tunggu sebelum sesi dimulai otomatis dari layar awal |

Durasi, metode pembayaran, dan karakter pembeli acak berasal dari konsep pengguna. Nilai skor, jeda, jumlah minimal variasi karakter, ukuran antrean, serta auto-start adalah default versi ini dan harus diterapkan. Jangan menambahkan menu untuk mengubahnya.

## FR-01 — Pembayaran

Tepat tiga metode tersedia, dalam urutan tombol yang tetap:

| ID internal | Label pemain | Representasi |
| --- | --- | --- |
| `cash` | TUNAI | Membayar dengan uang tunai |
| `edc` | EDC | Membayar dengan kartu melalui EDC |
| `qris` | QRIS | Membayar melalui QRIS |

Pilihan pemain dibandingkan dengan ID metode yang diminta pembeli. Nama karakter, warna, kalimat, atau ikon bukan dasar penilaian. Semua pembayaran adalah simulasi tanpa proses transaksi nyata.

## FR-02 — Pembeli dan randomisasi

- Hanya satu pembeli aktif pada satu waktu.
- Tampilkan antrean FIFO berisi CFG-09 pembeli: pembeli pertama aktif di kasir, sisanya menunggu dan berjalan maju ketika antrean bergeser.
- Setiap pembeli memiliki ID unik dalam sesi, variasi karakter, dan satu metode pembayaran.
- Tetapkan metode pembayaran setiap orang ketika ia dibuat. Pembeli yang menunggu mempertahankan metode tersebut; hanya permintaan pembeli terdepan ditampilkan sebagai balon permintaan.
- Pilih karakter secara merata dari kumpulan yang memenuhi CFG-08.
- Pilih metode secara merata dari tiga pilihan; peluang teoretis tiap metode adalah 1/3.
- Pengambilan karakter dan metode harus independen. Karakter yang sama bisa menggunakan metode berbeda.
- Pengulangan karakter atau metode, termasuk berturut-turut, diperbolehkan.
- Jangan memaksakan distribusi sama dalam satu sesi dan jangan menghindari pengulangan secara tersembunyi.
- Isi antrean saat sesi dimulai. Setelah transisi jawaban benar selesai, keluarkan pembeli terdepan dan tambahkan satu pembeli baru di belakang agar ukuran antrean tetap CFG-09.
- Nomor pembeli baru bertambah meskipun penampilan dan permintaannya sama dengan sebelumnya.
- Render, perubahan timer, dan pilihan salah tidak boleh mengacak ulang pembeli atau permintaannya.
- Tidak ada batas jumlah pembeli selain durasi sesi.

## FR-03 — Waktu sesi

- Durasi mengikuti CFG-01: 20 detik.
- Mulai menghitung ketika pembeli pertama dan layar permainan siap menerima input. Waktu di layar awal dan persiapan aset tidak ikut dihitung.
- Countdown lima detik hanya berlaku sebelum sesi pada layar awal (CFG-10). Tidak ada countdown pembuka gameplay, pause, bonus waktu, atau perpanjangan sesi.
- Semua jeda benar/salah termasuk dalam waktu sesi.
- Penerimaan pilihan ditentukan pada saat pilihan diproses: hanya diterima jika waktu saat itu lebih kecil daripada deadline dan input tidak terkunci.
- Pada waktu tepat sama dengan deadline atau lebih besar, pilihan ditolak dan sesi berakhir.
- Timer tetap berjalan ketika tab berada di latar belakang. Saat kembali, tampilkan hasil jika deadline sudah terlewati, sebelum menerima input baru.
- Waktu habis mengalahkan transisi pembeli atau pembukaan lock yang terjadi bersamaan.
- Keterlambatan render browser tidak boleh memperpanjang durasi logis.

## FR-04 — Skor dan statistik

Awal sesi: skor, pembeli terlayani, dan pilihan salah semuanya 0.

- Benar: tambahkan CFG-02 pada skor dan tambah pembeli terlayani sebanyak satu.
- Salah: kurangi skor dengan CFG-03, batasi hasil minimal CFG-04, dan tambah pilihan salah sebanyak satu.
- Terapkan batas bawah setelah **setiap keputusan**.
- Input yang ditolak atau diabaikan tidak mengubah skor maupun hitungan.
- Pembeli yang belum selesai saat waktu habis tidak memberi poin atau penalti tambahan.
- Poin benar yang diterima sebelum deadline tetap dihitung meskipun transisinya belum selesai.
- Hasil akhir memakai state terakhir yang sah; tidak dihitung ulang dengan formula agregat yang mengabaikan urutan keputusan.

Contoh turunan parameter: salah pada skor 0 lalu benar menghasilkan 10, bukan 5. Benar tiga kali, salah sekali, lalu benar dua kali menghasilkan skor 45, lima pembeli terlayani, dan satu kesalahan.

## FR-05 — Pelayanan dan feedback

- Saat benar, langsung catat skor dan pembeli terlayani, tampilkan feedback, lalu kunci seluruh pilihan selama CFG-05. Setelah jeda berakhir, tampilkan pembeli baru jika masih ada waktu.
- Saat salah, langsung terapkan penalti dan catat kesalahan, tampilkan feedback, lalu kunci seluruh pilihan selama CFG-06. Sesudahnya, pembeli dan permintaan yang sama tetap aktif.
- Satu kesalahan dihitung untuk setiap pilihan salah yang diterima. Kesalahan berikutnya dapat terjadi setelah lock berakhir.
- Input selama lock diabaikan dan tidak diantrekan untuk diproses nanti.
- Feedback hilang ketika lock selesai atau hasil muncul. Teks serta bentuk feedback mengikuti UX/UI.
- Pilihan benar menampilkan tanda `$` melayang dan memainkan bunyi “cring”; salah, lock, atau input ditolak tidak memicu efek tersebut.
- Untuk pilihan benar, tampilkan beberapa tanda `$` yang melayang dan mainkan bunyi singkat “cring”. Jangan memicu efek ini untuk jawaban salah atau input yang ditolak.

## FR-06 — Kontrol dan keputusan

- Pemain memilih dengan klik, tap, atau aktivasi keyboard pada tiga tombol pembayaran.
- Satu aktivasi hanya boleh dinilai sekali.
- Dua klik fisik merupakan dua percobaan terpisah; setiap klik tetap tunduk pada lock, identitas pembeli, dan deadline.
- Klik cepat setelah pembeli baru tampil dan input terbuka tetap valid, termasuk saat metode berikutnya sama.
- Menahan tombol keyboard tidak boleh menghasilkan jawaban berulang dari auto-repeat.
- Aksi untuk pembeli atau sesi lama tidak boleh menilai pembeli/sesi baru.
- Tidak ada input pembayaran yang diterima di layar awal atau hasil.

## FR-07 — Mulai, ulang, dan siklus sesi

- Layar awal menyediakan Mulai; hasil menyediakan Main Lagi.
- Layar awal menampilkan hanya judul **Kasir Sat Set**, nilai benar/salah/minimum, preview metode, tombol Mulai, dan countdown CFG-10.
- Aktivasi Mulai membatalkan countdown. Tanpa aktivasi sampai 0, tepat satu sesi otomatis dimulai.
- Layar awal hanya menampilkan judul **Kasir Sat Set**, nilai poin benar/salah/skor minimum, tiga metode, dan tombol Mulai dengan countdown CFG-10. Jika pemain tidak memilih Mulai sebelum countdown selesai, mulai satu sesi otomatis.
- Aktivasi Mulai sebelum countdown selesai membatalkan auto-start. Countdown tidak boleh memulai ulang atau menggandakan sesi yang sudah aktif.
- Mulai berulang ketika sesi aktif tidak boleh mereset sesi atau menambah loop.
- Main Lagi langsung memulai sesi baru, tanpa kembali ke layar awal.
- Sesi baru memiliki identitas baru, pembeli baru, deadline baru, skor dan hitungan nol, serta tidak mewarisi feedback/lock/callback lama.
- Finalisasi hanya terjadi satu kali dan hasil dibekukan setelah sesi selesai.
- Refresh halaman kembali ke layar awal. Tidak ada penyimpanan skor, resume, atau riwayat sesi.

## FR-08 — Layar dan hasil

- Tersedia layar awal, permainan, dan hasil.
- Saat bermain, permintaan pembeli, waktu, skor, dan tiga pilihan selalu terlihat pada ukuran target UX/UI.
- Permintaan menampilkan label metode secara jelas, bukan hanya warna atau ikon.
- Karakter pembeli tidak menampilkan nama atau nomor identitas; identitas internal hanya untuk menjaga aksi terhadap antrean yang benar.
- Jangan tampilkan nama atau nomor identitas pada pembeli aktif maupun pembeli yang mengantre.
- Hasil menunjukkan skor akhir, jumlah pembeli terlayani, dan jumlah pilihan salah.
- Skor nol adalah hasil yang valid. Tidak ada ambang lulus/gagal.
- Kontrol pembayaran tidak aktif setelah selesai.

## FR-09 — Pengalaman lintas perangkat

- Antarmuka berbahasa Indonesia dengan ilustrasi warung dan variasi karakter.
- Font utama adalah **AU Passata**. Gunakan file/font resmi berlisensi yang disediakan secara lokal; jangan mengambil font dari CDN. Fallback jika font tidak tersedia adalah Arial/sans-serif dan tidak dianggap reproduksi tipografi identik.
- Palet antarmuka memakai warna biru, putih, dan kuning yang terinspirasi palet BRI; jangan menggunakan logo atau mengesankan integrasi resmi.
- Mendukung mouse, sentuhan, dan keyboard.
- Tata letak, fokus, keterbacaan, pengurangan animasi, dan ukuran target mengikuti UX/UI.
- Pengurangan animasi tidak mengubah aturan waktu dan lock.

## FR-10 — Batas sistem dan kualitas

- Game berjalan di browser tanpa backend, database, akun, atau transaksi pembayaran nyata.
- Semua aset aplikasi tersedia lokal; tidak ada ketergantungan CDN atau layanan eksternal saat dimainkan.
- Penyimpanan permainan hanya dalam memori.
- Tidak ada placeholder, hasil palsu, aset rusak, atau error aplikasi pada hasil yang diserahkan.
- Kode, tes, perintah menjalankan, dan bukti verifikasi harus dapat diperiksa.

## Di luar lingkup

Jangan menambahkan fitur berikut ke implementasi awal:

- Login, akun, profil, pengumpulan nama, atau data pribadi.
- Backend, database, leaderboard daring, atau sinkronisasi skor.
- Integrasi pembayaran, kamera, pemindaian QR, atau transaksi uang sungguhan.
- Metode keempat seperti transfer, e-wallet terpisah, atau paylater.
- Perhitungan harga belanja, kembalian, stok, atau pemindaian barang.
- Nyawa, combo, multiplier, bonus waktu, level, atau pause.
- Batas kesabaran individual pembeli atau beberapa pembeli aktif sekaligus.
- Iklan, analitik, pelacakan, dan permintaan izin perangkat.
- Musik, suara, serta aset yang harus diunduh ketika permainan berlangsung.

## Ketentuan perubahan dan penerimaan

Revisi aturan dimulai dari dokumen ini, kemudian diperbarui pada implementasi, UX terkait, dan test plan. Perubahan gaya visual yang tetap memenuhi UX tidak boleh diam-diam mengubah mekanik.

Seluruh FR-01 sampai FR-10 wajib dipenuhi. [Test plan](05-test-plan.md) memetakan setiap kebutuhan ke pemeriksaan. Status implementasi hanya dinyatakan selesai setelah persyaratan serta kriteria selesai pada [panduan mulai](00-start-here.md) terpenuhi.
