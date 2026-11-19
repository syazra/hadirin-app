import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { listenIzinKelas } from '@/services/izin-service';
import { listenPesertaKelas } from '@/services/peserta-service';
import { listenPresensiSesi } from '@/services/presensi-service';
import type {
  Izin,
  Keanggotaan,
  Presensi,
  StatusKeanggotaan,
  StatusRekap,
  StatusSesi,
} from '@/types';
import { tentukanStatusRekap } from '@/utils/tentukan-status-rekap';

export interface ItemRekapSesi {
  uid: string;
  nama: string;
  nim: string;
  statusKeanggotaan: StatusKeanggotaan;
  statusRekap: StatusRekap;
  /** True jika izin DISETUJUI namun klasifikasi AI gagal/belum tersedia (fallback IZIN) */
  aiBelumTersedia: boolean;
  waktuHadir: Date | null;
  izin: Izin | null;
}

export interface RekapSesi {
  daftarRekap: ItemRekapSesi[];
  daftarHadir: ItemRekapSesi[];
  daftarSakit: ItemRekapSesi[];
  daftarIzinDisetujui: ItemRekapSesi[];
  daftarIzinLainnya: ItemRekapSesi[];
  daftarAlpha: ItemRekapSesi[];
  daftarBelumHadir: ItemRekapSesi[];
  jumlahHadir: number;
  jumlahSakit: number;
  jumlahIzin: number;
  jumlahIzinMenunggu: number;
  jumlahAlpha: number;
  jumlahBelumHadir: number;
  totalPeserta: number;
  loading: boolean;
  error: string | null;
}

interface StateRekap {
  kunci: string | null;
  peserta: Keanggotaan[];
  presensi: Presensi[];
  izin: Izin[];
  siap: {
    peserta: boolean;
    presensi: boolean;
    izin: boolean;
  };
  errors: {
    peserta: string | null;
    presensi: string | null;
    izin: string | null;
  };
}

const STATE_AWAL: StateRekap = {
  kunci: null,
  peserta: [],
  presensi: [],
  izin: [],
  siap: { peserta: false, presensi: false, izin: false },
  errors: { peserta: null, presensi: null, izin: null },
};

const REKAP_KOSONG: RekapSesi = {
  daftarRekap: [],
  daftarHadir: [],
  daftarSakit: [],
  daftarIzinDisetujui: [],
  daftarIzinLainnya: [],
  daftarAlpha: [],
  daftarBelumHadir: [],
  jumlahHadir: 0,
  jumlahSakit: 0,
  jumlahIzin: 0,
  jumlahIzinMenunggu: 0,
  jumlahAlpha: 0,
  jumlahBelumHadir: 0,
  totalPeserta: 0,
  loading: false,
  error: null,
};

export function useRekapSesi(
  idSesi: string | null,
  idKelas: string | null,
  statusSesi: StatusSesi = 'DIBUKA',
): RekapSesi {
  const { pengguna } = useAuth();
  const [state, setState] = useState<StateRekap>(STATE_AWAL);

  const kunciAktif =
    pengguna && idSesi && idKelas
      ? `${pengguna.uid}:${idSesi}:${idKelas}`
      : null;

  useEffect(() => {
    if (!pengguna || !idSesi || !idKelas || !kunciAktif) {
      return;
    }

    const buatStateBaru = (prev: StateRekap): StateRekap =>
      prev.kunci === kunciAktif
        ? prev
        : {
            kunci: kunciAktif,
            peserta: [],
            presensi: [],
            izin: [],
            siap: { peserta: false, presensi: false, izin: false },
            errors: { peserta: null, presensi: null, izin: null },
          };

    const unsubPeserta = listenPesertaKelas(
      idKelas,
      (data) => {
        setState((prev) => {
          const base = buatStateBaru(prev);
          return {
            ...base,
            peserta: data,
            siap: { ...base.siap, peserta: true },
            errors: { ...base.errors, peserta: null },
          };
        });
      },
      (err) => {
        setState((prev) => {
          const base = buatStateBaru(prev);
          return {
            ...base,
            siap: { ...base.siap, peserta: true },
            errors: {
              ...base.errors,
              peserta: err.message || 'Gagal memuat daftar peserta.',
            },
          };
        });
      },
    );

    const unsubPresensi = listenPresensiSesi(
      idSesi,
      (data) => {
        setState((prev) => {
          const base = buatStateBaru(prev);
          return {
            ...base,
            presensi: data,
            siap: { ...base.siap, presensi: true },
            errors: { ...base.errors, presensi: null },
          };
        });
      },
      (err) => {
        setState((prev) => {
          const base = buatStateBaru(prev);
          return {
            ...base,
            siap: { ...base.siap, presensi: true },
            errors: {
              ...base.errors,
              presensi: err.message || 'Gagal memuat data presensi sesi.',
            },
          };
        });
      },
    );

    const unsubIzin = listenIzinKelas(
      idKelas,
      (data) => {
        const izinSesiIni = data.filter((item) => item.sesiId === idSesi);
        setState((prev) => {
          const base = buatStateBaru(prev);
          return {
            ...base,
            izin: izinSesiIni,
            siap: { ...base.siap, izin: true },
            errors: { ...base.errors, izin: null },
          };
        });
      },
      (err) => {
        setState((prev) => {
          const base = buatStateBaru(prev);
          return {
            ...base,
            siap: { ...base.siap, izin: true },
            errors: {
              ...base.errors,
              izin: err.message || 'Gagal memuat data izin sesi.',
            },
          };
        });
      },
    );

    return () => {
      unsubPeserta();
      unsubPresensi();
      unsubIzin();
    };
  }, [pengguna, idSesi, idKelas, kunciAktif]);

  return useMemo(() => {
    if (!kunciAktif) {
      return REKAP_KOSONG;
    }

    if (state.kunci !== kunciAktif) {
      return {
        ...REKAP_KOSONG,
        loading: true,
      };
    }

    const { peserta, presensi, izin, siap, errors } = state;
    const loading = !siap.peserta || !siap.presensi || !siap.izin;
    const error = errors.peserta ?? errors.presensi ?? errors.izin ?? null;

    if (error) {
      return {
        ...REKAP_KOSONG,
        loading,
        error,
      };
    }

    const mapPresensi = new Map<string, Presensi>();
    for (const item of presensi) {
      mapPresensi.set(item.uid, item);
    }

    const mapIzin = new Map<string, Izin>();
    for (const item of izin) {
      mapIzin.set(item.uid, item);
    }

    const daftarRekap: ItemRekapSesi[] = [];
    const uidTercatat = new Set<string>();

    for (const anggota of peserta) {
      const catatanPresensi = mapPresensi.get(anggota.uid) ?? null;
      const catatanIzin = mapIzin.get(anggota.uid) ?? null;

      if (anggota.status === 'NONAKTIF' && !catatanPresensi && !catatanIzin) {
        continue;
      }

      uidTercatat.add(anggota.uid);

      const { status, aiBelumTersedia } = tentukanStatusRekap({
        presensi: catatanPresensi,
        izin: catatanIzin,
        statusSesi,
      });

      daftarRekap.push({
        uid: anggota.uid,
        nama: anggota.nama,
        nim: anggota.nim,
        statusKeanggotaan: anggota.status,
        statusRekap: status,
        aiBelumTersedia,
        waktuHadir: catatanPresensi?.waktuHadir ?? null,
        izin: catatanIzin,
      });
    }

    const uidTambahan = new Set<string>([
      ...mapPresensi.keys(),
      ...mapIzin.keys(),
    ]);
    for (const uid of uidTambahan) {
      if (uidTercatat.has(uid)) continue;
      const catatanPresensi = mapPresensi.get(uid) ?? null;
      const catatanIzin = mapIzin.get(uid) ?? null;

      const { status, aiBelumTersedia } = tentukanStatusRekap({
        presensi: catatanPresensi,
        izin: catatanIzin,
        statusSesi,
      });

      daftarRekap.push({
        uid,
        nama: 'Peserta',
        nim: uid,
        statusKeanggotaan: 'NONAKTIF',
        statusRekap: status,
        aiBelumTersedia,
        waktuHadir: catatanPresensi?.waktuHadir ?? null,
        izin: catatanIzin,
      });
    }

    const daftarHadir = daftarRekap
      .filter((item) => item.statusRekap === 'HADIR')
      .sort(
        (a, b) =>
          (b.waktuHadir?.getTime() ?? 0) - (a.waktuHadir?.getTime() ?? 0),
      );

    const daftarSakit = daftarRekap
      .filter((item) => item.statusRekap === 'SAKIT')
      .sort((a, b) => a.nama.localeCompare(b.nama));

    const daftarIzinDisetujui = daftarRekap
      .filter((item) => item.statusRekap === 'IZIN')
      .sort((a, b) => a.nama.localeCompare(b.nama));

    const daftarIzinLainnya = daftarRekap
      .filter(
        (item) =>
          (item.statusRekap === 'BELUM_HADIR' ||
            item.statusRekap === 'ALPHA') &&
          item.izin !== null &&
          (item.izin.statusIzin === 'MENUNGGU' ||
            item.izin.statusIzin === 'DITOLAK'),
      )
      .sort((a, b) => a.nama.localeCompare(b.nama));

    const daftarAlpha = daftarRekap
      .filter((item) => item.statusRekap === 'ALPHA')
      .sort((a, b) => a.nama.localeCompare(b.nama));

    const daftarBelumHadir = daftarRekap
      .filter((item) => item.statusRekap === 'BELUM_HADIR')
      .sort((a, b) => a.nama.localeCompare(b.nama));

    const jumlahIzinMenunggu = daftarRekap.filter(
      (item) => item.izin?.statusIzin === 'MENUNGGU',
    ).length;

    return {
      daftarRekap,
      daftarHadir,
      daftarSakit,
      daftarIzinDisetujui,
      daftarIzinLainnya,
      daftarAlpha,
      daftarBelumHadir,
      jumlahHadir: daftarHadir.length,
      jumlahSakit: daftarSakit.length,
      jumlahIzin: daftarIzinDisetujui.length,
      jumlahIzinMenunggu,
      jumlahAlpha: daftarAlpha.length,
      jumlahBelumHadir: daftarBelumHadir.length,
      totalPeserta: daftarRekap.length,
      loading,
      error: null,
    };
  }, [kunciAktif, state, statusSesi]);
}