import * as Location from 'expo-location';

import type { KoordinatPengguna } from '@/types/location';

export type HasilCekKesiapanLokasi =
  | { siap: true }
  | {
      siap: false;
      permissionDenied: boolean;
      servicesDisabled: boolean;
      pesan: string;
    };

export function petakanLokasiKeKoordinat(
  lokasi: Location.LocationObject,
): KoordinatPengguna {
  return {
    latitude: lokasi.coords.latitude,
    longitude: lokasi.coords.longitude,
    accuracy:
      typeof lokasi.coords.accuracy === 'number' &&
      Number.isFinite(lokasi.coords.accuracy)
        ? lokasi.coords.accuracy
        : null,
    timestamp: lokasi.timestamp ?? Date.now(),
  };
}

/**
 * Memeriksa status layanan GPS perangkat dan meminta izin lokasi foreground.
 */
export async function pastikanIzinDanLayananLokasi(): Promise<HasilCekKesiapanLokasi> {
  try {
    const layananAktif = await Location.hasServicesEnabledAsync();
    if (!layananAktif) {
      return {
        siap: false,
        permissionDenied: false,
        servicesDisabled: true,
        pesan:
          'Layanan lokasi (GPS) perangkat tidak aktif. Aktifkan GPS terlebih dahulu.',
      };
    }

    const izinSekarang = await Location.getForegroundPermissionsAsync();
    let statusIzin = izinSekarang.status;

    if (statusIzin !== Location.PermissionStatus.GRANTED) {
      const hasilMintaIzin =
        await Location.requestForegroundPermissionsAsync();
      statusIzin = hasilMintaIzin.status;
    }

    if (statusIzin !== Location.PermissionStatus.GRANTED) {
      return {
        siap: false,
        permissionDenied: true,
        servicesDisabled: false,
        pesan:
          'Izin akses lokasi ditolak. Izinkan akses lokasi pada pengaturan aplikasi untuk melanjutkan.',
      };
    }

    return { siap: true };
  } catch {
    return {
      siap: false,
      permissionDenied: false,
      servicesDisabled: false,
      pesan: 'Gagal memeriksa izin atau layanan lokasi perangkat.',
    };
  }
}

/**
 * Mengambil posisi GPS terbaru satu kali dengan akurasi tinggi.
 */
export async function ambilPosisiSekarang(): Promise<KoordinatPengguna> {
  const lokasi = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return petakanLokasiKeKoordinat(lokasi);
}

/**
 * Memulai pemantauan lokasi secara realtime dan mengembalikan fungsi pembersih (unsubscribe).
 */
export async function mulaiPantauLokasi(
  onUpdate: (posisi: KoordinatPengguna) => void,
): Promise<() => void> {
  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 3000,
      distanceInterval: 3,
    },
    (lokasi) => {
      onUpdate(petakanLokasiKeKoordinat(lokasi));
    },
  );

  return () => {
    subscription.remove();
  };
}