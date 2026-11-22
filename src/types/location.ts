export interface KoordinatPengguna {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export interface StateLokasiPengguna {
  loading: boolean;
  permissionDenied: boolean;
  servicesDisabled: boolean;
  position: KoordinatPengguna | null;
  isLowAccuracy: boolean;
  isStale: boolean;
  error: string | null;
}

export interface OpsiLokasiPengguna {
  /** Aktifkan pemantauan lokasi berkelanjutan (watchPositionAsync). Default: true */
  watch?: boolean;
  /** Batas toleransi akurasi GPS dalam meter sebelum dianggap low accuracy. Default: 50 */
  batasAkurasiMeter?: number;
  /** Batas umur titik GPS dalam milidetik sebelum dianggap basi (stale). Default: 30000 (30 detik) */
  batasUsiaMs?: number;
}