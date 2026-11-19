import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    where,
} from '@react-native-firebase/firestore';

import { getFirebaseServices, isFirebaseAvailable } from '@/lib/firebase';
import type { StatusSesi } from '@/types';

export interface AktivitasLaboratoriumItem {
  idSesi: string;
  kelasId: string;
  namaPraktikum: string;
  judulSesi: string;
  labId: string;
  lokasi: string;
  waktuMulai: Date;
  waktuSelesai: Date | null;
  statusSesi: StatusSesi;
}

export interface RingkasanAktivitasLaboratorium {
  currentActivities: AktivitasLaboratoriumItem[];
  nextActivities: AktivitasLaboratoriumItem[];
}

const DEFAULT_DURASI_SESI_MS = 2 * 60 * 60 * 1000; // Fallback 2 jam jika waktuSelesai null
const STATUS_SESI_VALID: readonly StatusSesi[] = [
  'BELUM_DIBUKA',
  'DIBUKA',
  'DITUTUP',
];

function konversiKeDate(nilai: unknown): Date | null {
  if (nilai === null || nilai === undefined) {
    return null;
  }

  if (nilai instanceof Timestamp) {
    return nilai.toDate();
  }

  if (nilai instanceof Date) {
    return Number.isNaN(nilai.getTime()) ? null : nilai;
  }

  if (
    typeof nilai === 'object' &&
    'toDate' in nilai &&
    typeof (nilai as { toDate: unknown }).toDate === 'function'
  ) {
    const hasil = (nilai as { toDate: () => Date }).toDate();
    return hasil instanceof Date && !Number.isNaN(hasil.getTime())
      ? hasil
      : null;
  }

  return null;
}

function bacaStatusSesi(nilai: unknown): StatusSesi {
  if (
    typeof nilai === 'string' &&
    (STATUS_SESI_VALID as readonly string[]).includes(nilai)
  ) {
    return nilai as StatusSesi;
  }
  return 'BELUM_DIBUKA';
}

/**
 * Memformat jam dalam zona waktu Asia/Jakarta (WIB), misal: "08:00 - 10:00 WIB".
 */
export function formatRentangJamJakarta(
  waktuMulai: Date,
  waktuSelesai: Date | null,
): string {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const jamMulai = formatter.format(waktuMulai).replace('.', ':');
  if (!waktuSelesai) {
    return `${jamMulai} WIB`;
  }

  const jamSelesai = formatter.format(waktuSelesai).replace('.', ':');
  return `${jamMulai} - ${jamSelesai} WIB`;
}

/**
 * Memformat tanggal & jam dalam zona waktu Asia/Jakarta (WIB) untuk jadwal berikutnya.
 */
export function formatJadwalJakarta(
  waktuMulai: Date,
  waktuSelesai: Date | null,
): string {
  const formatTanggal = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return `${formatTanggal.format(waktuMulai)}, ${formatRentangJamJakarta(waktuMulai, waktuSelesai)}`;
}

/**
 * Mengelompokkan daftar sesi aktif pada sebuah laboratorium menjadi:
 * - currentActivities: sesi berstatus `DIBUKA` atau sesi yang rentang waktunya sedang berlangsung
 * - nextActivities: sesi `BELUM_DIBUKA` yang jadwal mulainya berada setelah `waktuSekarang`
 */
export function hitungAktivitasLaboratorium(
  daftarSesi: AktivitasLaboratoriumItem[],
  waktuSekarang: Date = new Date(),
): RingkasanAktivitasLaboratorium {
  const sekarangMs = waktuSekarang.getTime();
  const currentActivities: AktivitasLaboratoriumItem[] = [];
  const nextActivities: AktivitasLaboratoriumItem[] = [];

  const terurut = [...daftarSesi].sort(
    (a, b) => a.waktuMulai.getTime() - b.waktuMulai.getTime(),
  );

  for (const sesi of terurut) {
    if (sesi.statusSesi === 'DITUTUP') {
      continue;
    }

    const mulaiMs = sesi.waktuMulai.getTime();
    const selesaiMs = sesi.waktuSelesai
      ? sesi.waktuSelesai.getTime()
      : mulaiMs + DEFAULT_DURASI_SESI_MS;

    const sedangBerlangsungWaktu =
      sekarangMs >= mulaiMs && sekarangMs <= selesaiMs;

    if (sesi.statusSesi === 'DIBUKA' || sedangBerlangsungWaktu) {
      currentActivities.push(sesi);
    } else if (sesi.statusSesi === 'BELUM_DIBUKA' && mulaiMs > sekarangMs) {
      nextActivities.push(sesi);
    }
  }

  return {
    currentActivities,
    nextActivities,
  };
}

/**
 * Mendengarkan daftar sesi berdasarkan `labId` secara real-time, menggabungkan
 * nama praktikum dari koleksi `kelas`, dan menghitung aktivitas saat ini & berikutnya.
 */
export function listenAktivitasLaboratorium(
  labId: string,
  onData: (ringkasan: RingkasanAktivitasLaboratorium) => void,
  onError: (error: Error) => void,
): () => void {
  const labIdBersih = typeof labId === 'string' ? labId.trim() : '';
  if (!labIdBersih) {
    onData({ currentActivities: [], nextActivities: [] });
    return () => {};
  }

  if (!isFirebaseAvailable) {
    onError(
      new Error('Firebase Hadir.in saat ini hanya tersedia di Android.'),
    );
    return () => {};
  }

  const { db } = getFirebaseServices();
  const cacheKelas = new Map<
    string,
    { namaPraktikum: string; diarsipkan: boolean }
  >();
  let aktif = true;
  let versiSnapshot = 0;

  // Query composite: labId == labIdBersih, diarsipkan == false, orderBy waktuMulai asc
  const q = query(
    collection(db, 'sesi'),
    where('labId', '==', labIdBersih),
    where('diarsipkan', '==', false),
    orderBy('waktuMulai', 'asc'),
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      versiSnapshot += 1;
      const versiSaatIni = versiSnapshot;

      (async () => {
        try {
          interface SesiMentah {
            idSesi: string;
            kelasId: string;
            judulSesi: string;
            labId: string;
            lokasi: string;
            waktuMulai: Date;
            waktuSelesai: Date | null;
            statusSesi: StatusSesi;
          }
          const daftarMentah: SesiMentah[] = [];

          const kelasIdsBelumAda = new Set<string>();

          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const waktuMulai = konversiKeDate(data.waktuMulai);
            if (!waktuMulai) {
              continue;
            }

            const kelasId =
              typeof data.kelasId === 'string' ? data.kelasId.trim() : '';
            if (kelasId && !cacheKelas.has(kelasId)) {
              kelasIdsBelumAda.add(kelasId);
            }

            daftarMentah.push({
              idSesi: docSnap.id,
              kelasId,
              judulSesi:
                typeof data.judul === 'string' && data.judul.trim().length > 0
                  ? data.judul.trim()
                  : 'Sesi Praktikum',
              labId: labIdBersih,
              lokasi: typeof data.lokasi === 'string' ? data.lokasi.trim() : '',
              waktuMulai,
              waktuSelesai: konversiKeDate(data.waktuSelesai),
              statusSesi: bacaStatusSesi(data.statusSesi),
            });
          }

          if (kelasIdsBelumAda.size > 0) {
            await Promise.all(
              Array.from(kelasIdsBelumAda).map(async (kelasId) => {
                try {
                  const kelasSnap = await getDoc(doc(db, 'kelas', kelasId));
                  const kelasData = kelasSnap.data();
                  cacheKelas.set(kelasId, {
                    namaPraktikum:
                      typeof kelasData?.namaPraktikum === 'string' &&
                      kelasData.namaPraktikum.trim().length > 0
                        ? kelasData.namaPraktikum.trim()
                        : 'Praktikum',
                    diarsipkan: kelasData?.diarsipkan === true,
                  });
                } catch {
                  cacheKelas.set(kelasId, {
                    namaPraktikum: 'Praktikum',
                    diarsipkan: false,
                  });
                }
              }),
            );
          }

          if (!aktif || versiSaatIni !== versiSnapshot) {
            return;
          }

          const daftarLengkap: AktivitasLaboratoriumItem[] = [];
          for (const item of daftarMentah) {
            const infoKelas = item.kelasId
              ? cacheKelas.get(item.kelasId)
              : undefined;

            if (infoKelas?.diarsipkan) {
              continue;
            }

            daftarLengkap.push({
              ...item,
              namaPraktikum: infoKelas?.namaPraktikum ?? 'Praktikum',
            });
          }

          onData(hitungAktivitasLaboratorium(daftarLengkap));
        } catch (err) {
          if (!aktif || versiSaatIni !== versiSnapshot) {
            return;
          }
          onError(
            err instanceof Error
              ? err
              : new Error('Gagal memproses aktivitas laboratorium.'),
          );
        }
      })();
    },
    (error) => {
      if (!aktif) {
        return;
      }
      onError(error);
    },
  );

  return () => {
    aktif = false;
    unsubscribe();
  };
}