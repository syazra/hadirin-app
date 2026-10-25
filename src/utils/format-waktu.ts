const BULAN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const;

// Tampilkan waktu lokal perangkat dengan format Indonesia yang sama di setiap platform.
export function formatWaktu(waktu: string | null | undefined): string {
  if (!waktu?.trim()) return '-';

  const tanggal = new Date(waktu);
  if (Number.isNaN(tanggal.getTime())) return '-';

  const jam = String(tanggal.getHours()).padStart(2, '0');
  const menit = String(tanggal.getMinutes()).padStart(2, '0');

  return `${tanggal.getDate()} ${BULAN[tanggal.getMonth()]} ${tanggal.getFullYear()}, ${jam}.${menit}`;
}
