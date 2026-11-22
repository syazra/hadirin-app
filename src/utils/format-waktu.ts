const BULAN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const;

type InputWaktu =
  | Date
  | string
  | { toDate: () => Date }
  | null
  | undefined;

// Tampilkan waktu lokal perangkat dengan format Indonesia yang sama di setiap platform.
export function formatWaktu(waktu: InputWaktu): string {
  if (!waktu) return '-';

  let tanggal: Date;

  if (waktu instanceof Date) {
    tanggal = waktu;
  } else if (typeof waktu === 'string') {
    if (!waktu.trim()) return '-';
    tanggal = new Date(waktu);
  } else if (typeof waktu === 'object' && typeof waktu.toDate === 'function') {
    tanggal = waktu.toDate();
  } else {
    return '-';
  }

  if (Number.isNaN(tanggal.getTime())) return '-';

  const jam = String(tanggal.getHours()).padStart(2, '0');
  const menit = String(tanggal.getMinutes()).padStart(2, '0');

  return `${tanggal.getDate()} ${BULAN[tanggal.getMonth()]} ${tanggal.getFullYear()}, ${jam}.${menit}`;
}