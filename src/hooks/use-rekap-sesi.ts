import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { listenIzinSesi } from '@/services/izin-service';
import { listenPesertaKelas } from '@/services/peserta-service';
import { listenPresensiSesi } from '@/services/presensi-service';
import type {
  Izin,
  Keanggotaan,
  Presensi,
  StatusKeanggotaan,
  StatusRekap,
} from '@/types';

export interface ItemRekapSesi {
  uid: string;
  nama: string;
  nim: string;
  statusKeanggotaan: StatusKeanggotaan;
  statusRekap: StatusRekap;
  waktuHadir: Date | null;
  izin: Izin | null;
}

export interface RekapSesi {
  daftarRekap: ItemRekapSesi[];
  daftarHadir: ItemRekapSesi[];
  daftarIzinDisetujui: ItemRekapSesi[];
  daftarIzinLainnya: ItemRekapSesi[];
  daftarBelumHadir: ItemRekapSesi[];
  jumlahHadir: number;
  jumlahIzin: number;
  jumlahIzinMenunggu: number;
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
  error: string | null;
}

const STATE_AWAL: StateRekap = {
  kunci: null,
  peserta: [],
  presensi: [],
  izin: [],
  siap: { peserta: false, presensi: false, izin: false },
  error: null,
};

const REKAP_KOSONG: RekapSesi = {
  daftarRekap: [],
  daftarHadir: [],
  daftarIzinDisetujui: [],
  daftarIzinLainnya: [],
  daftarBelumHadir: [],
  jumlahHadir: 0,
  jumlahIzin: 0,
  jumlahIzinMenunggu: 0,
  jumlahBelumHadir: 0,
  totalPeserta: 0,
  loading: false,
  error: null,
};

export function useRekapSesi(
  idSesi: string | null,
  idKelas: string | null,
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
            error: null,
          };

    const tanganiError = (err: Error) => {
      setState((prev) => ({
        ...buatStateBaru(prev),
        siap: { peserta: true, presensi: true, izin: true },
        error: err.message || 'Gagal memuat data rekap sesi.',
      }));
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
            error: null,
          };
        });
      },
      tanganiError,
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
            error: null,
          };
        });
      },
      tanganiError,
    );

    const unsubIzin = listenIzinSesi(
      idSesi,
      (data) => {
        setState((prev) => {
          const base = buatStateBaru(prev);
          return {
            ...base,
            izin: data,
            siap: { ...base.siap, izin: true },
            error: null,
          };
        });
      },
      tanganiError,
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

    const { peserta, presensi, izin, siap, error } = state;
    const loading = !siap.peserta || !siap.presensi || !siap.izin;

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

      let statusRekap: StatusRekap = 'BELUM_HADIR';
      if (catatanPresensi) {
        statusRekap = 'HADIR';
      } else if (catatanIzin?.statusIzin === 'DISETUJUI') {
        statusRekap = 'IZIN';
      }

      daftarRekap.push({
        uid: anggota.uid,
        nama: anggota.nama,
        nim: anggota.nim,
        statusKeanggotaan: anggota.status,
        statusRekap,
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

      let statusRekap: StatusRekap = 'BELUM_HADIR';
      if (catatanPresensi) {
        statusRekap = 'HADIR';
      } else if (catatanIzin?.statusIzin === 'DISETUJUI') {
        statusRekap = 'IZIN';
      }

      daftarRekap.push({
        uid,
        nama: 'Peserta',
        nim: uid,
        statusKeanggotaan: 'NONAKTIF',
        statusRekap,
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

    const daftarIzinDisetujui = daftarRekap
      .filter((item) => item.statusRekap === 'IZIN')
      .sort((a, b) => a.nama.localeCompare(b.nama));

    const daftarIzinLainnya = daftarRekap
      .filter(
        (item) =>
          item.statusRekap === 'BELUM_HADIR' &&
          item.izin !== null &&
          (item.izin.statusIzin === 'MENUNGGU' ||
            item.izin.statusIzin === 'DITOLAK'),
      )
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
      daftarIzinDisetujui,
      daftarIzinLainnya,
      daftarBelumHadir,
      jumlahHadir: daftarHadir.length,
      jumlahIzin: daftarIzinDisetujui.length,
      jumlahIzinMenunggu,
      jumlahBelumHadir: daftarBelumHadir.length,
      totalPeserta: daftarRekap.length,
      loading,
      error,
    };
  }, [kunciAktif, state]);
}