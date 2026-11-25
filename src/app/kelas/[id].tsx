import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KelasFormSheet } from '@/components/asisten/kelas-form-sheet';
import {
  SesiFormSheet,
  type NilaiFormSesi,
} from '@/components/asisten/sesi-form-sheet';
import { TambahPesertaSheet } from '@/components/asisten/tambah-peserta-sheet';
import { BrandGradient } from '@/components/ui/brand-gradient';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import {
  IconArchive,
  IconChevronRight,
  IconClock,
  IconEdit,
  IconMapPin,
  IconPlus,
} from '@/components/ui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { EnterView, PressableScale } from '@/components/ui/motion';
import { StatusBadge } from '@/components/ui/status-badge';
import { getStaggerDelay, MotionSprings } from '@/constants/motion';
import { getWarmPastelTone } from '@/constants/pastel';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useKelasAsisten } from '@/hooks/use-kelas-asisten';
import { usePesertaKelas } from '@/hooks/use-peserta-kelas';
import { arsipkanKelas, ubahKelas } from '@/services/kelas-service';
import {
  nonaktifkanPeserta,
  tambahPesertaByKode,
} from '@/services/peserta-service';
import {
  arsipkanSesi,
  buatSesi,
  listenSesiKelas,
  ubahSesi,
} from '@/services/sesi-service';
import type { Keanggotaan, Sesi } from '@/types';

type FilterKelas = 'sesi' | 'praktikan';

type FilterKelasBarProps = {
  aktif: FilterKelas;
  jumlahSesi: number;
  jumlahPraktikan: number;
  onGanti: (filter: FilterKelas) => void;
  /** Dipanggil saat tombol + ditekan. Tombol disembunyikan jika tidak diberikan (mis. kelas diarsipkan). */
  onTambah?: () => void;
};

const OPSI: { kunci: FilterKelas; label: string }[] = [
  { kunci: 'sesi', label: 'Sesi' },
  { kunci: 'praktikan', label: 'Praktikan' },
];

function FilterKelasBar({
  aktif,
  jumlahSesi,
  jumlahPraktikan,
  onGanti,
  onTambah,
}: FilterKelasBarProps) {
  const reducedMotion = useReducedMotion();
  const [segmentWidth, setSegmentWidth] = useState(0);
  const indicatorX = useSharedValue(0);

  const jumlah: Record<FilterKelas, number> = {
    sesi: jumlahSesi,
    praktikan: jumlahPraktikan,
  };

  const activeIndex = OPSI.findIndex((opsi) => opsi.kunci === aktif);

  useEffect(() => {
    const targetX =
      segmentWidth > 0 && activeIndex >= 0 ? activeIndex * (segmentWidth + 4) : 0;
    if (reducedMotion || segmentWidth === 0) {
      indicatorX.set(targetX);
    } else {
      indicatorX.set(withSpring(targetX, MotionSprings.gentle));
    }
  }, [activeIndex, indicatorX, reducedMotion, segmentWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.get() }],
  }));

  return (
    <View style={stylesFilter.baris}>
      <View
        style={stylesFilter.segmen}
        accessibilityRole="tablist"
        onLayout={(event) => {
          const innerWidth = event.nativeEvent.layout.width - 8 - 4;
          const eachWidth = Math.max(0, innerWidth / OPSI.length);
          if (eachWidth !== segmentWidth) {
            setSegmentWidth(eachWidth);
          }
        }}
      >
        {segmentWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              stylesFilter.indicator,
              { width: segmentWidth },
              indicatorStyle,
            ]}
          />
        ) : null}

        {OPSI.map((opsi) => {
          const dipilih = aktif === opsi.kunci;
          return (
            <Pressable
              key={opsi.kunci}
              onPress={() => onGanti(opsi.kunci)}
              accessibilityRole="tab"
              accessibilityState={{ selected: dipilih }}
              accessibilityLabel={`${opsi.label}, ${jumlah[opsi.kunci]} item`}
              style={({ pressed }) => [
                stylesFilter.opsi,
                dipilih && segmentWidth === 0 && stylesFilter.opsiAktif,
                pressed && !dipilih && stylesFilter.ditekan,
              ]}
            >
              <Text
                style={[
                  stylesFilter.opsiTeks,
                  dipilih && stylesFilter.opsiTeksAktif,
                ]}
              >
                {opsi.label}
              </Text>
              <View
                style={[
                  stylesFilter.hitung,
                  dipilih && stylesFilter.hitungAktif,
                ]}
              >
                <Text
                  style={[
                    stylesFilter.hitungTeks,
                    dipilih && stylesFilter.hitungTeksAktif,
                  ]}
                >
                  {jumlah[opsi.kunci]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {onTambah ? (
        <PressableScale
          onPress={onTambah}
          scaleTo={0.9}
          accessibilityRole="button"
          accessibilityLabel={
            aktif === 'sesi' ? 'Tambah sesi' : 'Tambah praktikan'
          }
          hitSlop={6}
          style={stylesFilter.tombolTambah}
        >
          <IconPlus size={22} color="#FFFFFF" strokeWidth={2.4} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const stylesFilter = StyleSheet.create({
  baris: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  segmen: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    padding: 4,
    gap: 4,
    borderRadius: Radii.md + 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    ...Shadows.subtle,
  },
  indicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: Radii.sm + 2,
    backgroundColor: Colors.light.primary,
  },
  opsi: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radii.sm + 2,
  },
  opsiAktif: {
    backgroundColor: Colors.light.primary,
  },
  opsiTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
    color: Colors.light.textSecondary,
  },
  opsiTeksAktif: {
    fontFamily: Fonts.sansBold,
    color: '#FFFFFF',
  },
  hitung: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  hitungAktif: {
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  hitungTeks: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  hitungTeksAktif: {
    color: '#FFFFFF',
  },
  tombolTambah: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    ...Shadows.primaryGlow,
  },
  ditekan: {
    opacity: 0.82,
  },
});

const BULAN_SINGKAT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const KATA_PENGHUBUNG = new Set(['dan', 'di', 'ke', 'dari', 'untuk', 'yang']);

function buatInisial(nama: string): string {
  const kata = nama
    .trim()
    .split(/\s+/)
    .map((bagian) => bagian.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
    .filter(
      (bagian) =>
        bagian.length > 0 && !KATA_PENGHUBUNG.has(bagian.toLowerCase()),
    );

  if (kata.length === 0) return '?';
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase();
  return kata
    .slice(0, 2)
    .map((bagian) => bagian[0])
    .join('')
    .toUpperCase();
}

function formatJam(tanggal: Date): string {
  const jam = String(tanggal.getHours()).padStart(2, '0');
  const menit = String(tanggal.getMinutes()).padStart(2, '0');
  return `${jam}.${menit}`;
}

function formatRentangJam(mulai: Date, selesai: Date | null): string {
  const awal = formatJam(mulai);
  if (!selesai) return `${awal} WIB`;
  return `${awal}–${formatJam(selesai)} WIB`;
}

function formatTanggalSingkat(tanggal: Date | null | undefined): string {
  if (!tanggal) return 'Memproses…';
  return tanggal.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DetailKelasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const kelasId = typeof id === 'string' ? id : '';

  const { pengguna } = useAuth();
  const {
    kelas,
    loading: loadingKelas,
    error: errorKelas,
    cobaLagi: cobaLagiKelas,
  } = useKelasAsisten(pengguna?.uid ?? null, {
    sertakanArsip: true,
    hitungPeserta: false,
  });

  const {
    peserta,
    loading: loadingPeserta,
    error: errorPeserta,
    cobaLagi: cobaLagiPeserta,
  } = usePesertaKelas(kelasId || null);

  const kelasAktif = kelas.find((item) => item.idKelas === kelasId) ?? null;

  const [stateSesi, setStateSesi] = useState<{
    kelasId: string;
    retryKey: number;
    sesi: Sesi[];
    loading: boolean;
    error: string | null;
  } | null>(null);
  const [retrySesiKey, setRetrySesiKey] = useState(0);

  const cobaLagiSesi = useCallback(() => {
    setRetrySesiKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!kelasId) {
      return;
    }

    const idKelasAktif = kelasId;
    const retryAktif = retrySesiKey;
    let aktif = true;

    const unsubscribe = listenSesiKelas(
      idKelasAktif,
      (daftarSesi) => {
        if (!aktif) return;
        setStateSesi({
          kelasId: idKelasAktif,
          retryKey: retryAktif,
          sesi: daftarSesi,
          loading: false,
          error: null,
        });
      },
      (error) => {
        if (!aktif) return;
        setStateSesi({
          kelasId: idKelasAktif,
          retryKey: retryAktif,
          sesi: [],
          loading: false,
          error:
            error.message.trim().length > 0
              ? error.message
              : 'Gagal memuat daftar sesi kelas.',
        });
      },
      true,
    );

    return () => {
      aktif = false;
      unsubscribe();
    };
  }, [kelasId, retrySesiKey]);

  const stateSesiAktif =
    kelasId &&
    stateSesi?.kelasId === kelasId &&
    stateSesi.retryKey === retrySesiKey
      ? stateSesi
      : null;
  const sesiKelas = stateSesiAktif?.sesi ?? [];
  const loadingSesi = kelasId ? (stateSesiAktif?.loading ?? true) : false;
  const errorSesi = stateSesiAktif?.error ?? null;

  const [filter, setFilter] = useState<FilterKelas>('sesi');

  const [editTerbuka, setEditTerbuka] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [errorEdit, setErrorEdit] = useState<string | null>(null);

  const [arsipTerbuka, setArsipTerbuka] = useState(false);
  const [loadingArsip, setLoadingArsip] = useState(false);

  const [tambahPesertaTerbuka, setTambahPesertaTerbuka] = useState(false);
  const [loadingTambahPeserta, setLoadingTambahPeserta] = useState(false);
  const [errorTambahPeserta, setErrorTambahPeserta] = useState<string | null>(
    null,
  );

  const [pesertaDinonaktifkan, setPesertaDinonaktifkan] =
    useState<Keanggotaan | null>(null);
  const [loadingStatusPeserta, setLoadingStatusPeserta] = useState(false);

  const [formSesiTerbuka, setFormSesiTerbuka] = useState(false);
  const [modeFormSesi, setModeFormSesi] = useState<'tambah' | 'ubah'>('tambah');
  const [sesiDiedit, setSesiDiedit] = useState<Sesi | null>(null);
  const [loadingSimpanSesi, setLoadingSimpanSesi] = useState(false);
  const [errorFormSesi, setErrorFormSesi] = useState<string | null>(null);

  const [sesiDiarsipkan, setSesiDiarsipkan] = useState<Sesi | null>(null);
  const [loadingArsipSesi, setLoadingArsipSesi] = useState(false);

  const handleUbahKelas = async (namaPraktikum: string) => {
    if (!kelasAktif || kelasAktif.diarsipkan) return;
    setLoadingEdit(true);
    setErrorEdit(null);

    const hasil = await ubahKelas(kelasAktif.idKelas, { namaPraktikum });
    setLoadingEdit(false);

    if (!hasil.ok) {
      setErrorEdit(hasil.pesan);
      return;
    }

    setEditTerbuka(false);
  };

  const handleArsipkanKelas = async () => {
    if (!kelasAktif || kelasAktif.diarsipkan || loadingArsip) return;
    setLoadingArsip(true);

    const hasil = await arsipkanKelas(kelasAktif.idKelas);
    setLoadingArsip(false);

    if (!hasil.ok) {
      Alert.alert('Gagal mengarsipkan kelas', hasil.pesan);
      return;
    }

    setArsipTerbuka(false);
  };

  const handleTambahPeserta = async (kodePeserta: string) => {
    if (!kelasAktif || kelasAktif.diarsipkan) return;
    setLoadingTambahPeserta(true);
    setErrorTambahPeserta(null);
    const hasil = await tambahPesertaByKode(kelasAktif.idKelas, kodePeserta);
    setLoadingTambahPeserta(false);
    if (!hasil.ok) {
      setErrorTambahPeserta(hasil.pesan);
      return;
    }
    setTambahPesertaTerbuka(false);
  };

  const handleKonfirmasiNonaktif = async () => {
    if (
      !kelasAktif ||
      kelasAktif.diarsipkan ||
      !pesertaDinonaktifkan ||
      loadingStatusPeserta
    ) {
      return;
    }
    setLoadingStatusPeserta(true);

    const hasil = await nonaktifkanPeserta(pesertaDinonaktifkan.idKeanggotaan);
    setLoadingStatusPeserta(false);

    if (!hasil.ok) {
      Alert.alert('Gagal menonaktifkan peserta', hasil.pesan);
      return;
    }

    setPesertaDinonaktifkan(null);
  };

  const handleSimpanSesi = async (nilai: NilaiFormSesi) => {
    if (!kelasAktif || kelasAktif.diarsipkan || loadingSimpanSesi) return;
    setLoadingSimpanSesi(true);
    setErrorFormSesi(null);

    const hasil =
      modeFormSesi === 'tambah'
        ? await buatSesi({
            kelasId: kelasAktif.idKelas,
            judul: nilai.judul,
            labId: nilai.labId,
            waktuMulai: nilai.waktuMulai,
            waktuSelesai: nilai.waktuSelesai,
          })
        : sesiDiedit
          ? await ubahSesi(sesiDiedit.idSesi, {
              judul: nilai.judul,
              labId: nilai.labId,
              waktuMulai: nilai.waktuMulai,
              waktuSelesai: nilai.waktuSelesai,
            })
          : null;

    setLoadingSimpanSesi(false);

    if (!hasil) {
      setErrorFormSesi('Sesi yang akan diubah tidak ditemukan.');
      return;
    }

    if (!hasil.ok) {
      setErrorFormSesi(hasil.pesan);
      return;
    }

    setFormSesiTerbuka(false);
    setSesiDiedit(null);
  };

  const handleKonfirmasiArsipSesi = async () => {
    if (
      !kelasAktif ||
      kelasAktif.diarsipkan ||
      !sesiDiarsipkan ||
      loadingArsipSesi
    ) {
      return;
    }
    setLoadingArsipSesi(true);

    const hasil = await arsipkanSesi(sesiDiarsipkan.idSesi);
    setLoadingArsipSesi(false);

    if (!hasil.ok) {
      Alert.alert('Gagal mengarsipkan sesi', hasil.pesan);
      return;
    }

    setSesiDiarsipkan(null);
  };

  const handleTekanTambah = () => {
    if (!kelasAktif || kelasAktif.diarsipkan) return;
    if (filter === 'sesi') {
      setModeFormSesi('tambah');
      setSesiDiedit(null);
      setErrorFormSesi(null);
      setFormSesiTerbuka(true);
    } else {
      setErrorTambahPeserta(null);
      setTambahPesertaTerbuka(true);
    }
  };

  if (loadingKelas) {
    return (
      <>
        <Stack.Screen options={{ title: 'Detail Kelas' }} />
        <LoadingState pesan="Memuat detail kelas…" />
      </>
    );
  }

  if (errorKelas) {
    return (
      <>
        <Stack.Screen options={{ title: 'Detail Kelas' }} />
        <ErrorState pesan={errorKelas} onCobaLagi={cobaLagiKelas} />
      </>
    );
  }

  if (!kelasAktif) {
    return (
      <>
        <Stack.Screen options={{ title: 'Detail Kelas' }} />
        <View style={styles.container}>
          <View style={styles.emptyWrap}>
            <EmptyState
              judul="Kelas tidak ditemukan"
              pesan="Kelas tidak tersedia atau Anda tidak memiliki akses ke kelas ini."
            />
          </View>
        </View>
      </>
    );
  }

  const jumlahPesertaAktif = peserta.filter((p) => p.status === 'AKTIF').length;
  const daftarPesertaUrut = [...peserta].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === 'AKTIF' ? -1 : 1;
  });

  const jumlahSesiAktif = sesiKelas.filter((s) => !s.diarsipkan).length;
  const daftarSesiUrut = [...sesiKelas].sort((a, b) => {
    if (a.diarsipkan === b.diarsipkan) return 0;
    return a.diarsipkan ? 1 : -1;
  });

  return (
    <>
      <Stack.Screen
        options={{ title: kelasAktif.namaPraktikum || 'Detail Kelas' }}
      />
      <View style={styles.container}>
        {/* Bagian atas: hero + segment bar */}
        <View style={styles.headerTetap}>
          <EnterView delay={0}>
            <BrandGradient
              variant="indigo"
              style={[
                styles.hero,
                Shadows.primaryGlow,
                kelasAktif.diarsipkan && styles.heroDiarsipkan,
              ]}
            >
              <View style={styles.heroBarisAtas}>
                <View style={styles.heroIkon}>
                  <Text style={styles.heroIkonTeks}>
                    {buatInisial(kelasAktif.namaPraktikum)}
                  </Text>
                </View>

                <View style={styles.heroJudulWrap}>
                  <Text style={styles.heroJudul} numberOfLines={2}>
                    {kelasAktif.namaPraktikum}
                  </Text>
                  <Text style={styles.heroSub} numberOfLines={1}>
                    {formatTanggalSingkat(kelasAktif.dibuatPada)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.heroBadge,
                    kelasAktif.diarsipkan && styles.heroBadgeArsip,
                  ]}
                >
                  <Text style={styles.heroBadgeTeks}>
                    {kelasAktif.diarsipkan ? 'Arsip' : 'Aktif'}
                  </Text>
                </View>
              </View>

              <View style={styles.heroBarisBawah}>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipAngka}>{jumlahPesertaAktif}</Text>
                  <Text style={styles.heroChipLabel}>Praktikan</Text>
                </View>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipAngka}>{jumlahSesiAktif}</Text>
                  <Text style={styles.heroChipLabel}>Sesi</Text>
                </View>

                <View style={styles.spacer} />

                {!kelasAktif.diarsipkan ? (
                  <>
                    <Pressable
                      onPress={() => {
                        setErrorEdit(null);
                        setEditTerbuka(true);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Ubah nama kelas"
                      style={({ pressed }) => [
                        styles.heroTombol,
                        pressed && styles.ditekan,
                      ]}
                    >
                      <IconEdit size={13} color="#FFFFFF" strokeWidth={2.1} />
                      <Text style={styles.heroTombolTeks}>Ubah</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setArsipTerbuka(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Arsipkan kelas"
                      style={({ pressed }) => [
                        styles.heroTombol,
                        styles.heroTombolBahaya,
                        pressed && styles.ditekan,
                      ]}
                    >
                      <IconArchive size={13} color="#FFE4EC" strokeWidth={2.1} />
                      <Text style={styles.heroTombolBahayaTeks}>Arsipkan</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </BrandGradient>
          </EnterView>

          <FilterKelasBar
            aktif={filter}
            jumlahSesi={jumlahSesiAktif}
            jumlahPraktikan={jumlahPesertaAktif}
            onGanti={setFilter}
            onTambah={kelasAktif.diarsipkan ? undefined : handleTekanTambah}
          />
        </View>

        <ScrollView
          style={styles.daftarScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 24 + insets.bottom },
          ]}
        >
          <EnterView key={filter} distance={10}>
            {filter === 'sesi' ? (
              <>
                {loadingSesi ? (
                  <View style={styles.stateBox}>
                    <LoadingState pesan="Memuat sesi praktikum…" layarPenuh={false} />
                  </View>
                ) : errorSesi ? (
                  <View style={styles.stateBox}>
                    <ErrorState
                      pesan={errorSesi}
                      onCobaLagi={cobaLagiSesi}
                      layarPenuh={false}
                    />
                  </View>
                ) : daftarSesiUrut.length === 0 ? (
                  <EmptyState
                    judul="Belum ada sesi"
                    pesan={
                      kelasAktif.diarsipkan
                        ? 'Tidak ada sesi pada kelas arsip ini.'
                        : 'Tekan tombol + untuk menambah sesi praktikum.'
                    }
                  />
                ) : (
                  <View style={styles.daftarPeserta}>
                    {daftarSesiUrut.map((item, index) => {
                      const sesiTerkunci =
                        kelasAktif.diarsipkan || item.diarsipkan;
                      const dibuka =
                        !item.diarsipkan && item.statusSesi === 'DIBUKA';
                      const belumDibuka =
                        !item.diarsipkan && item.statusSesi === 'BELUM_DIBUKA';

                      const dateBg = dibuka
                        ? Colors.light.successSoft
                        : belumDibuka
                          ? Colors.light.warmSoft
                          : Colors.light.backgroundElement;
                      const dateFg = dibuka
                        ? Colors.light.success
                        : belumDibuka
                          ? Colors.light.warm
                          : Colors.light.textSecondary;

                      return (
                        <EnterView
                          key={item.idSesi}
                          delay={getStaggerDelay(index)}
                          animateLayout
                        >
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: '/sesi/[id]',
                                params: { id: item.idSesi },
                              })
                            }
                            accessibilityRole="button"
                            accessibilityLabel={`Buka detail sesi ${item.judul}`}
                            pressRetentionOffset={0}
                            unstable_pressDelay={100}
                            style={({ pressed }) => [
                              styles.kartuSesi,
                              item.diarsipkan && styles.kartuRedup,
                              pressed && styles.ditekan,
                            ]}
                          >
                        <View
                          style={[
                            styles.sesiAksen,
                            dibuka && styles.sesiAksenAktif,
                            belumDibuka && styles.sesiAksenMendatang,
                          ]}
                        />
                        <View style={styles.sesiIsi}>
                          <View style={styles.sesiBarisUtama}>
                            <View
                              style={[
                                styles.sesiTanggal,
                                { backgroundColor: dateBg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.sesiTanggalAngka,
                                  { color: dateFg },
                                ]}
                              >
                                {item.waktuMulai.getDate()}
                              </Text>
                              <Text
                                style={[
                                  styles.sesiTanggalBulan,
                                  { color: dateFg },
                                ]}
                              >
                                {BULAN_SINGKAT[item.waktuMulai.getMonth()]}
                              </Text>
                            </View>

                            <View style={styles.sesiInfo}>
                              <View style={styles.barisAtas}>
                                <Text
                                  style={styles.namaSesi}
                                  numberOfLines={2}
                                >
                                  {item.judul}
                                </Text>
                                {item.diarsipkan ? (
                                  <View style={styles.badgeRedup}>
                                    <Text style={styles.badgeRedupTeks}>
                                      Arsip
                                    </Text>
                                  </View>
                                ) : (
                                  <StatusBadge status={item.statusSesi} />
                                )}
                              </View>

                              <View style={styles.metaLine}>
                                <IconMapPin
                                  size={12.5}
                                  color={Colors.light.teal}
                                />
                                <Text style={styles.meta} numberOfLines={1}>
                                  {item.lokasi}
                                </Text>
                              </View>

                              <View style={styles.metaLine}>
                                <IconClock
                                  size={12.5}
                                  color={Colors.light.textSecondary}
                                />
                                <Text style={styles.meta} numberOfLines={1}>
                                  {formatRentangJam(
                                    item.waktuMulai,
                                    item.waktuSelesai,
                                  )}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.barisTombolSesi}>
                            {!sesiTerkunci ? (
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setModeFormSesi('ubah');
                                  setSesiDiedit(item);
                                  setErrorFormSesi(null);
                                  setFormSesiTerbuka(true);
                                }}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                  styles.tombolSekunder,
                                  pressed && styles.ditekan,
                                ]}
                              >
                                <IconEdit size={12.5} color={Colors.light.text} />
                                <Text style={styles.tombolSekunderTeks}>
                                  Ubah
                                </Text>
                              </Pressable>
                            ) : null}

                            {!sesiTerkunci && item.statusSesi !== 'DIBUKA' ? (
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setSesiDiarsipkan(item);
                                }}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                  styles.tombolBahaya,
                                  pressed && styles.ditekan,
                                ]}
                              >
                                <IconArchive
                                  size={12.5}
                                  color={Colors.light.danger}
                                />
                                <Text style={styles.tombolBahayaTeks}>
                                  Arsipkan
                                </Text>
                              </Pressable>
                            ) : null}

                            <View style={styles.spacer} />
                            <IconChevronRight
                              size={17}
                              color={Colors.light.textSecondary}
                            />
                          </View>
                        </View>
                      </Pressable>
                    </EnterView>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <>
              {loadingPeserta ? (
                <View style={styles.stateBox}>
                  <LoadingState
                    pesan="Memuat peserta kelas…"
                    layarPenuh={false}
                  />
                </View>
              ) : errorPeserta ? (
                <View style={styles.stateBox}>
                  <ErrorState
                    pesan={errorPeserta}
                    onCobaLagi={cobaLagiPeserta}
                    layarPenuh={false}
                  />
                </View>
              ) : daftarPesertaUrut.length === 0 ? (
                <EmptyState
                  judul="Belum ada peserta"
                  pesan={
                    kelasAktif.diarsipkan
                      ? 'Tidak ada praktikan pada kelas arsip ini.'
                      : 'Tambahkan praktikan dengan 8 karakter kode peserta.'
                  }
                />
              ) : (
                <View style={styles.daftarPeserta}>
                  {daftarPesertaUrut.map((item, index) => {
                    const isNonaktif = item.status === 'NONAKTIF';
                    const tone = getWarmPastelTone(item.nama);

                    return (
                      <EnterView
                        key={item.idKeanggotaan}
                        delay={getStaggerDelay(index)}
                        animateLayout
                      >
                        <View
                          style={[
                            styles.kartuPeserta,
                            isNonaktif && styles.kartuRedup,
                          ]}
                        >
                          <View
                            style={[
                              styles.avatar,
                              { backgroundColor: tone.bg },
                            ]}
                          >
                            <Text
                              style={[styles.avatarTeks, { color: tone.fg }]}
                            >
                              {buatInisial(item.nama)}
                            </Text>
                          </View>

                          <View style={styles.infoPeserta}>
                            <Text
                              style={styles.namaPeserta}
                              numberOfLines={1}
                            >
                              {item.nama}
                            </Text>
                            <Text style={styles.nimMono}>{item.nim}</Text>
                          </View>

                          {isNonaktif ? (
                            <View style={styles.badgeRedup}>
                              <Text style={styles.badgeRedupTeks}>Nonaktif</Text>
                            </View>
                          ) : !kelasAktif.diarsipkan ? (
                            <Pressable
                              disabled={loadingStatusPeserta}
                              onPress={() => setPesertaDinonaktifkan(item)}
                              accessibilityRole="button"
                              style={({ pressed }) => [
                                styles.tombolBahaya,
                                pressed && styles.ditekan,
                              ]}
                            >
                              <Text style={styles.tombolBahayaTeks}>
                                Nonaktifkan
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </EnterView>
                    );
                  })}
                </View>
              )}
            </>
          )}
          </EnterView>
        </ScrollView>
      </View>

      <KelasFormSheet
        visible={editTerbuka}
        mode="ubah"
        nilaiAwal={kelasAktif.namaPraktikum}
        loading={loadingEdit}
        errorPesan={errorEdit}
        onSubmit={handleUbahKelas}
        onTutup={() => {
          if (!loadingEdit) setEditTerbuka(false);
        }}
      />

      <SesiFormSheet
        visible={formSesiTerbuka}
        mode={modeFormSesi}
        sesiAwal={sesiDiedit}
        loading={loadingSimpanSesi}
        errorPesan={errorFormSesi}
        onSubmit={handleSimpanSesi}
        onTutup={() => {
          if (!loadingSimpanSesi) {
            setFormSesiTerbuka(false);
            setSesiDiedit(null);
          }
        }}
      />

      <ConfirmSheet
        visible={sesiDiarsipkan !== null}
        judul="Arsipkan sesi?"
        pesan={
          sesiDiarsipkan
            ? `Sesi "${sesiDiarsipkan.judul}" akan diarsipkan. Riwayat presensi dan izin tetap tersimpan.`
            : ''
        }
        labelKonfirmasi="Arsipkan"
        labelLoading="Mengarsipkan…"
        loading={loadingArsipSesi}
        destructive
        onKonfirmasi={handleKonfirmasiArsipSesi}
        onBatal={() => {
          if (!loadingArsipSesi) setSesiDiarsipkan(null);
        }}
      />

      <ConfirmSheet
        visible={arsipTerbuka}
        judul="Arsipkan kelas?"
        pesan={`Kelas "${kelasAktif.namaPraktikum}" akan diarsipkan. Riwayat tetap tersimpan, tetapi peserta dan sesi baru tidak dapat ditambahkan.`}
        labelKonfirmasi="Arsipkan"
        labelLoading="Mengarsipkan…"
        loading={loadingArsip}
        destructive
        onKonfirmasi={handleArsipkanKelas}
        onBatal={() => {
          if (!loadingArsip) setArsipTerbuka(false);
        }}
      />

      <TambahPesertaSheet
        visible={tambahPesertaTerbuka}
        loading={loadingTambahPeserta}
        errorPesan={errorTambahPeserta}
        onSubmit={handleTambahPeserta}
        onTutup={() => {
          if (!loadingTambahPeserta) setTambahPesertaTerbuka(false);
        }}
      />

      <ConfirmSheet
        visible={pesertaDinonaktifkan !== null}
        judul="Nonaktifkan peserta?"
        pesan={
          pesertaDinonaktifkan
            ? `${pesertaDinonaktifkan.nama} akan dinonaktifkan dari kelas ini. Riwayat presensi dan izin tetap tersimpan.`
            : ''
        }
        labelKonfirmasi="Nonaktifkan"
        labelLoading="Menonaktifkan…"
        loading={loadingStatusPeserta}
        destructive
        onKonfirmasi={handleKonfirmasiNonaktif}
        onBatal={() => {
          if (!loadingStatusPeserta) setPesertaDinonaktifkan(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  emptyWrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 14,
    gap: 12,
  },
  headerTetap: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 14,
    backgroundColor: Colors.light.background,
  },
  daftarScroll: {
    flex: 1,
  },
  hero: {
    gap: 14,
    padding: 18,
    borderRadius: Radii.xl,
  },
  heroDiarsipkan: {
    opacity: 0.72,
  },
  heroBarisAtas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIkon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroIkonTeks: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  heroJudulWrap: {
    flex: 1,
    gap: 2,
  },
  heroJudul: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 23,
    color: '#FFFFFF',
  },
  heroSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.82)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  heroBadgeArsip: {
    backgroundColor: 'rgba(28, 25, 41, 0.28)',
  },
  heroBadgeTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  heroBarisBawah: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Radii.sm + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroChipAngka: {
    fontFamily: Fonts.sansBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  heroChipLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroTombol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  heroTombolTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  heroTombolBahaya: {
    backgroundColor: 'rgba(214, 61, 103, 0.35)',
  },
  heroTombolBahayaTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: '#FFE4EC',
  },
  barisAtas: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.light.textSecondary,
    flexShrink: 1,
  },
  stateBox: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    padding: 12,
    ...Shadows.subtle,
  },
  daftarPeserta: {
    gap: 12,
  },
  kartuRedup: {
    opacity: 0.62,
  },
  badgeRedup: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  badgeRedupTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  kartuSesi: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    ...Shadows.card,
  },
  sesiAksen: {
    width: 4,
    backgroundColor: Colors.light.border,
  },
  sesiAksenAktif: {
    backgroundColor: Colors.light.success,
  },
  sesiAksenMendatang: {
    backgroundColor: Colors.light.warm,
  },
  sesiIsi: {
    flex: 1,
    gap: 8,
    padding: 14,
  },
  sesiBarisUtama: {
    flexDirection: 'row',
    gap: 12,
  },
  sesiTanggal: {
    width: 48,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sesiTanggalAngka: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 22,
  },
  sesiTanggalBulan: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10.5,
    textTransform: 'uppercase',
  },
  sesiInfo: {
    flex: 1,
    gap: 4,
  },
  namaSesi: {
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
  },
  barisTombolSesi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  spacer: {
    flex: 1,
  },
  kartuPeserta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: Radii.md + 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    ...Shadows.subtle,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTeks: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  infoPeserta: {
    flex: 1,
    gap: 3,
  },
  namaPeserta: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14.5,
    color: Colors.light.text,
  },
  nimMono: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  tombolSekunder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radii.sm,
    backgroundColor: Colors.light.backgroundElement,
  },
  tombolSekunderTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.text,
  },
  tombolBahaya: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radii.sm,
    backgroundColor: Colors.light.dangerSoft,
  },
  tombolBahayaTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.danger,
  },
  ditekan: {
    opacity: 0.82,
  },
});
