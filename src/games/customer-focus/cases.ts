export const cases = [
  {
    id: 'login',
    customer: 'Nasabah lansia bingung saat masuk ke layanan digital.',
    solution: 'Dampingi nasabah memahami langkah masuk melalui panduan resmi.',
  },
  {
    id: 'qris',
    customer: 'Merchant mengalami kendala saat menerima pembayaran QRIS.',
    solution: 'Bantu periksa kendala QRIS dan arahkan ke dukungan atau opsi pembayaran yang tersedia.',
  },
  {
    id: 'transfer',
    customer: 'Nasabah melihat status transfer masih pending.',
    solution: 'Bantu periksa status transaksi melalui kanal resmi sebelum menentukan langkah berikutnya.',
  },
] as const

export type CaseId = (typeof cases)[number]['id']

export const solutionOrder: readonly CaseId[] = ['qris', 'transfer', 'login']