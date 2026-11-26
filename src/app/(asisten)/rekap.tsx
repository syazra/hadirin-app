import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RekapItem } from '@/components/asisten/rekap-item';
import { RingkasanHadir } from '@/components/asisten/ringkasan-hadir';
import { BrandGradient } from '@/components/ui/brand-gradient';
import {
  DropdownSelect,
  type DropdownOption,
} from '@/components/ui/dropdown-select';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { IconClock, IconMapPin } from '@/components/ui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { EnterView, PressableScale } from '@/components/ui/motion';
import { StatusBadge } from '@/components/ui/status-badge';
import { getStaggerDelay } from '@/constants/motion';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useJadwalAsisten } from '@/hooks/use-jadwal-asisten';
import { useKelasAsisten } from '@/hooks/use-kelas-asisten';
import { useRekapSesi } from '@/hooks/use-rekap-sesi';
import { formatWaktu } from '@/utils/format-waktu';

type FilterStatusRekap =
  | 'SEMUA'
  | 'HADIR'
  | 'IZIN_SAKIT'
  | 'MENUNGGU'
  | 'BELUM_ALPHA';

export default function RekapScreen() {
  const insets = useSafeAreaInsets();
  const { pengguna } = useAuth();
  const {
    kelas,
    loading: loadingKelas,
    error: errorKelas,
  } = useKelasAsisten(pengguna?.uid ?? null);
  const {
    sesi,
    loading: loadingSesi,
    error: errorSesi,
  } = useJadwalAsisten(pengguna?.uid ?? null);

  const [idKelasPilihan, setIdKelasPilihan] = useState<string>('');
  const [idSesiPilihan, setIdSesiPilihan] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatusRekap>('SEMUA');

  const idKelasTerpilih = useMemo(() => {
    if (kelas.length === 0) return '';
    return kelas.some((item) => item.idKelas === idKelasPilihan)
      ? idKelasPilihan
      : kelas[0].idKelas;
  }, [kelas, idKelasPilihan]);

  const sesiKelas = useMemo(
    () =>
      sesi
        .filter((item) => item.kelasId === idKelasTerpilih)
        .sort((a, b) => a.waktuMulai.getTime() - b.waktuMulai.getTime()),
    [sesi, idKelasTerpilih],
  );

  const idSesiTerpilih = useMemo(() => {
    if (sesiKelas.length === 0) return '';
    return sesiKelas.some((item) => item.idSesi === idSesiPilihan)
      ? idSesiPilihan
      : sesiKelas[0].idSesi;
  }, [sesiKelas, idSesiPilihan]);

  const kelasAktif = kelas.find((item) => item.idKelas === idKelasTerpilih);
  const sesiAktif = sesiKelas.find((item) => item.idSesi === idSesiTerpilih);

  const opsiKelas: DropdownOption[] = useMemo(
    () =>
      kelas.map((item) => {
        const jumlahPertemuan = sesi.filter(
          (s) => s.kelasId === item.idKelas,
        ).length;
        return {
          value: item.idKelas,
          label: item.namaPraktikum,
          subtitle: `${jumlahPertemuan} pertemuan`,
        };
      }),
    [kelas, sesi],
  );

  const opsiSesi: DropdownOption[] = useMemo(
    () =>
      sesiKelas.map((item, idx) => ({
        value: item.idSesi,
        label: item.judul || `Pertemuan ${idx + 1}`,
        subtitle: `${item.lokasi} · ${formatWaktu(item.waktuMulai.toISOString())}`,
        badge: <StatusBadge status={item.statusSesi} />,
      })),
    [sesiKelas],
  );

  const rekap = useRekapSesi(
    sesiAktif?.idSesi ?? null,
    sesiAktif?.kelasId ?? null,
    sesiAktif?.statusSesi ?? 'DIBUKA',
  );

  const daftarTerurut = useMemo(
    () => [
      ...rekap.daftarHadir,
      ...rekap.daftarSakit,
      ...rekap.daftarIzinDisetujui,
      ...rekap.daftarIzinLainnya,
      ...rekap.daftarAlpha,
      ...rekap.daftarBelumHadir,
    ],
    [rekap],
  );

  const daftarTampil = useMemo(() => {
    switch (filterStatus) {
      case 'HADIR':
        return rekap.daftarHadir;
      case 'IZIN_SAKIT':
        return [...rekap.daftarSakit, ...rekap.daftarIzinDisetujui];
      case 'MENUNGGU':
        return rekap.daftarIzinLainnya;
      case 'BELUM_ALPHA':
        return [...rekap.daftarAlpha, ...rekap.daftarBelumHadir];
      default:
        return daftarTerurut;
    }
  }, [filterStatus, rekap, daftarTerurut]);

  if (loadingKelas || loadingSesi) {
    return <LoadingState pesan="Memuat daftar kelas dan sesi..." />;
  }

  if (errorKelas || errorSesi) {
    return (
      <ErrorState
        pesan={errorKelas ?? errorSesi ?? 'Gagal memuat data rekap.'}
      />
    );
  }

  if (kelas.length === 0) {
    return (
      <View
        style={[
          styles.emptyWrap,
          { paddingBottom: Spacing.four + insets.bottom },
        ]}
      >
        <EmptyState
          judul="Belum ada kelas"
          pesan="Buat kelas terlebih dahulu untuk memantau rekap kehadiran."
        />
      </View>
    );
  }

  const opsiFilter: { key: FilterStatusRekap; label: string; count: number }[] =
    [
      { key: 'SEMUA', label: 'Semua', count: daftarTerurut.length },
      { key: 'HADIR', label: 'Hadir', count: rekap.daftarHadir.length },
      {
        key: 'IZIN_SAKIT',
        label: 'Izin/Sakit',
        count: rekap.daftarSakit.length + rekap.daftarIzinDisetujui.length,
      },
      {
        key: 'MENUNGGU',
        label: 'Menunggu',
        count: rekap.daftarIzinLainnya.length,
      },
      {
        key: 'BELUM_ALPHA',
        label: 'Belum/Alpha',
        count: rekap.daftarAlpha.length + rekap.daftarBelumHadir.length,
      },
    ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: 36 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.filterCard}>
        <DropdownSelect
          label="Mata Kuliah / Kelas"
          placeholder="Pilih mata kuliah"
          sheetTitle="Pilih Mata Kuliah"
          options={opsiKelas}
          selectedValue={idKelasTerpilih}
          onSelect={(idKelasBaru) => {
            setIdKelasPilihan(idKelasBaru);
            setIdSesiPilihan('');
            setFilterStatus('SEMUA');
          }}
        />

        <DropdownSelect
          label="Pertemuan"
          placeholder={
            sesiKelas.length === 0
              ? 'Belum ada pertemuan'
              : 'Pilih pertemuan'
          }
          sheetTitle="Pilih Pertemuan"
          options={opsiSesi}
          selectedValue={idSesiTerpilih}
          disabled={sesiKelas.length === 0}
          emptyText="Kelas ini belum memiliki pertemuan."
          onSelect={(idSesiBaru) => {
            setIdSesiPilihan(idSesiBaru);
            setFilterStatus('SEMUA');
          }}
        />
      </View>

      {sesiKelas.length === 0 ? (
        <EmptyState
          judul="Belum ada sesi"
          pesan="Kelas ini belum memiliki sesi praktikum."
          emoji="📅"
        />
      ) : null}

      {sesiAktif && (
        <>
          <EnterView delay={20}>
            <BrandGradient
              variant="indigo"
              style={[styles.ringkasanHeader, Shadows.primaryGlow]}
            >
              <View style={styles.headerTopRow}>
                <Text style={styles.kelasTag} numberOfLines={1}>
                  {kelasAktif?.namaPraktikum}
                </Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {sesiAktif.statusSesi === 'DIBUKA'
                      ? 'Dibuka'
                      : sesiAktif.statusSesi === 'BELUM_DIBUKA'
                        ? 'Belum dibuka'
                        : 'Ditutup'}
                  </Text>
                </View>
              </View>
              <Text style={styles.namaSesi}>{sesiAktif.judul}</Text>
              <View style={styles.headerMetaRow}>
                <View style={styles.headerMetaItem}>
                  <IconMapPin size={13} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.lokasi}>{sesiAktif.lokasi}</Text>
                </View>
                <View style={styles.headerMetaItem}>
                  <IconClock size={13} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.lokasi}>
                    {formatWaktu(sesiAktif.waktuMulai.toISOString())}
                  </Text>
                </View>
              </View>
            </BrandGradient>
          </EnterView>

          {rekap.loading ? (
            <LoadingState pesan="Memuat rekap sesi..." layarPenuh={false} />
          ) : rekap.error ? (
            <ErrorState pesan={rekap.error} layarPenuh={false} />
          ) : (
            <>
              <RingkasanHadir
                jumlahHadir={rekap.jumlahHadir}
                jumlahSakit={rekap.jumlahSakit}
                jumlahIzin={rekap.jumlahIzin}
                jumlahAlpha={rekap.jumlahAlpha}
                jumlahBelumHadir={rekap.jumlahBelumHadir}
                jumlahIzinMenunggu={rekap.jumlahIzinMenunggu}
              />

              {rekap.totalPeserta === 0 ? (
                <EmptyState
                  judul="Belum ada peserta"
                  pesan="Belum ada catatan presensi atau izin pada sesi ini."
                />
              ) : (
                <View style={styles.listSection}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {opsiFilter.map((opsi) => {
                      const aktif = filterStatus === opsi.key;
                      return (
                        <PressableScale
                          key={opsi.key}
                          scaleTo={0.94}
                          onPress={() => setFilterStatus(opsi.key)}
                          style={[
                            styles.statusChip,
                            aktif && styles.statusChipAktif,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusChipText,
                              aktif && styles.statusChipTextAktif,
                            ]}
                          >
                            {opsi.label}
                          </Text>
                          <View
                            style={[
                              styles.countBubble,
                              aktif && styles.countBubbleAktif,
                            ]}
                          >
                            <Text
                              style={[
                                styles.countBubbleText,
                                aktif && styles.countBubbleTextAktif,
                              ]}
                            >
                              {opsi.count}
                            </Text>
                          </View>
                        </PressableScale>
                      );
                    })}
                  </ScrollView>

                  {daftarTampil.length > 0 ? (
                    <View style={styles.daftar}>
                      {daftarTampil.map((item, index) => (
                        <EnterView
                          key={item.uid}
                          delay={getStaggerDelay(index)}
                          animateLayout
                        >
                          <RekapItem {...item} />
                        </EnterView>
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      judul="Tidak ada peserta"
                      pesan="Tidak ada peserta pada kategori status ini."
                    />
                  )}
                </View>
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  container: {
    padding: 20,
    paddingTop: 14,
    gap: 14,
  },
  filterCard: {
    gap: 12,
    padding: 14,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    ...Shadows.subtle,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  ringkasanHeader: {
    padding: 18,
    borderRadius: Radii.xl,
    gap: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  kelasTag: {
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
  },
  statusPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  statusPillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  namaSesi: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  headerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  headerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  lokasi: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.92)',
  },
  listSection: {
    gap: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  statusChipAktif: {
    backgroundColor: Colors.light.text,
    borderColor: Colors.light.text,
  },
  statusChipText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.text,
  },
  statusChipTextAktif: {
    color: '#FFFFFF',
  },
  countBubble: {
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBubbleAktif: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  countBubbleText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10.5,
    color: Colors.light.textSecondary,
  },
  countBubbleTextAktif: {
    color: '#FFFFFF',
  },
  daftar: {
    gap: 10,
  },
});