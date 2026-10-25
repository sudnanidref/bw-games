// Contoh instruksi untuk panduan di dalam game.
// Semua contoh <= 35 karakter dan, jika dicoba berurutan dari papan kosong,
// setiap contoh menghasilkan tindakan yang berhasil (dijaga oleh guide.test.ts).
export type GuideGroup = { title: string; hint: string; examples: readonly string[] }

export const GUIDE_GROUPS: readonly GuideGroup[] = [
  {
    title: '1. Taruh bentuk',
    hint: 'Kata kerja + bentuk + warna + posisi.',
    examples: [
      'Taruh lingkaran biru di kiri atas',
      'Letakkan kotak merah di tengah',
      'Tempatkan segitiga hijau di B4',
      'Taruh kotak biru di baris 5 kolom 1',
    ],
  },
  {
    title: '2. Pindahkan bentuk',
    hint: 'Bentuknya harus sudah ada di papan rekan. Satu sel per instruksi: kiri, kanan, atas, atau bawah. Jika ada bentuk kembar, sebutkan selnya (mis. B4).',
    examples: [
      'Pindahkan lingkaran biru ke kanan',
      'Geser kotak merah ke bawah',
      'Pindahkan segitiga hijau B4 ke atas',
    ],
  },
  {
    title: '3. Hapus bentuk',
    hint: 'Bentuknya harus sudah ada di papan rekan. Jika ada bentuk kembar, sebutkan selnya.',
    examples: [
      'Hapus lingkaran biru',
      'Buang kotak merah di D3',
    ],
  },
]

export const GUIDE_VOCAB: ReadonlyArray<{ label: string; values: string }> = [
  { label: 'Bentuk', values: 'lingkaran, kotak, segitiga' },
  { label: 'Warna', values: 'merah, biru, hijau' },
  { label: 'Posisi', values: 'kode sel A1–E5 (huruf = baris, angka = kolom), "baris N kolom M", atau kiri atas, tengah atas, kanan atas, tengah kiri, tengah, tengah kanan, kiri bawah, tengah bawah, kanan bawah' },
  { label: 'Arah', values: 'kiri, kanan, atas, bawah — satu sel, tidak diagonal' },
  { label: 'Kata kerja', values: 'taruh/letakkan/tempatkan, pindahkan/geser, hapus/buang' },
]
