import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PanelAksiAsisten } from '@/components/asisten/panel-aksi-asisten';
import { RekapItem } from '@/components/asisten/rekap-item';
import { RingkasanHadir } from '@/components/asisten/ringkasan-hadir';
import { PanelAksiPraktikan } from '@/components/praktikan/panel-aksi-praktikan';
import { DetailSesi } from '@/components/shared/detail-sesi';
import { AppButton } from '@/components/ui/app-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { IconArchive, IconInfo } from '@/components/ui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { EnterView } from '@/components/ui/motion';
import { Colors, Fonts, Radii } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useIzinPengguna } from '@/hooks/use-izin-pengguna';
import { useRekapSesi } from '@/hooks/use-rekap-sesi';
import { useSesiDetail } from '@/hooks/use-sesi-detail';
import { listenPresensiPengguna } from '@/services/presensi-service';
import type { Presensi } from '@/types';
import { formatWaktu } from '@/utils/format-waktu';

export default function DetailSesiScreen() {
  const { id } = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const router = useRouter();
  const { pengguna, peran, loading: authLoading } = useAuth();
  const { izin, loading: izinLoading } = useIzinPengguna(pengguna?.uid ?? null);
  const [daftarPresensi, setDaftarPresensi] = useState<Presensi[]>([]);
  const [caraMemindaiTerbuka, setCaraMemindaiTerbuka] = useState(false);

  const idSesi = Array.isArray(id) ? id[0] : id;
  const {
    sesi,
    kelas,
    loading: sesiLoading,
    error,
    muatUlang,
  } = useSesiDetail(idSesi ?? null);

  useEffect(() => {
    if (peran !== 'PRAKTIKAN' || !pengguna?.uid) {
      return;
    }

    return listenPresensiPengguna(
      pengguna.uid,
      (data) => setDaftarPresensi(data),
      () => {},
    );
  }, [peran, pengguna?.uid]);

  const rekap = useRekapSesi(
    peran === 'ASISTEN' ? (sesi?.idSesi ?? null) : null,
    peran === 'ASISTEN' ? (sesi?.kelasId ?? null) : null,
    sesi?.statusSesi ?? 'DIBUKA',
  );

  if (authLoading) {
    return <LoadingState pesan="Memuat sesi akun..." />;
  }

  if (!pengguna) {
    return <Redirect href="/" />;
  }

  if (sesiLoading) {
    return <LoadingState pesan="Memuat detail sesi..." />;
  }

  if (error) {
    return (
      <ErrorState
        judul="Gagal memuat detail sesi"
        pesan={error}
        onCobaLagi={muatUlang}
      />
    );
  }

  if (!sesi) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          judul="Sesi tidak ditemukan"
          pesan="Data sesi yang kamu cari tidak tersedia."
        />
      </View>
    );
  }

  const dataDiarsipkan = Boolean(sesi.diarsipkan || kelas?.diarsipkan);
  const presensiSesiIni =
    peran === 'PRAKTIKAN' && pengguna?.uid
      ? daftarPresensi.find((item) => item.sesiId === sesi.idSesi)
      : undefined;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={muatUlang}
          tintColor={Colors.light.primary}
        />
      }
    >
      {dataDiarsipkan ? (
        <View style={styles.arsipBanner}>
          <IconArchive size={16} color={Colors.light.warning} />
          <Text style={styles.arsipText}>
            {kelas?.diarsipkan
              ? 'Kelas diarsipkan · hanya tersedia sebagai riwayat.'
              : 'Sesi diarsipkan · hanya tersedia sebagai riwayat.'}
          </Text>
        </View>
      ) : null}

      <EnterView delay={0}>
        <DetailSesi sesi={sesi} namaPraktikum={kelas?.namaPraktikum} />
      </EnterView>

      {peran === 'ASISTEN' && (
        <>
          <EnterView delay={70}>
            <PanelAksiAsisten
              sesi={sesi}
              kelasDiarsipkan={Boolean(kelas?.diarsipkan)}
            />
          </EnterView>

          <EnterView delay={130}>
            <View style={styles.rekapSection}>
              <Text style={styles.sectionTitle}>Rekap Kehadiran</Text>

              {rekap.loading ? (
                <LoadingState pesan="Memuat rekap kehadiran..." layarPenuh={false} />
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

                  {rekap.daftarRekap.length > 0 ? (
                    <View style={styles.rekapList}>
                      {rekap.daftarRekap.map((item) => (
                        <RekapItem key={item.uid} {...item} />
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      judul="Belum ada catatan"
                      pesan="Belum ada peserta pada sesi ini."
                    />
                  )}
                </>
              )}
            </View>
          </EnterView>
        </>
      )}

      {peran === 'PRAKTIKAN' && !dataDiarsipkan && (
        <>
          <EnterView delay={70}>
            <PanelAksiPraktikan
              statusSesi={sesi.statusSesi}
              statusIzin={
                izin.find((item) => item.sesiId === sesi.idSesi)?.statusIzin ??
                null
              }
              izinLoading={izinLoading}
              sudahPresensi={Boolean(presensiSesiIni)}
              waktuPresensi={
                presensiSesiIni?.waktuHadir
                  ? formatWaktu(presensiSesiIni.waktuHadir)
                  : undefined
              }
              onPressPresensi={() =>
                router.push({
                  pathname: '/scan-qr',
                  params: { idSesi: sesi.idSesi },
                })
              }
              onPressAjukanIzin={() =>
                router.push({
                  pathname: '/izin/ajukan',
                  params: { sesiId: sesi.idSesi },
                })
              }
            />
          </EnterView>

          <EnterView delay={130}>
            <Pressable
              onPress={() => setCaraMemindaiTerbuka(true)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.panduanLink,
                pressed && styles.pressed,
              ]}
            >
              <IconInfo size={16} color={Colors.light.primary} />
              <Text style={styles.panduanLinkText}>Panduan scan QR</Text>
            </Pressable>
          </EnterView>

          <BottomSheet
            visible={caraMemindaiTerbuka}
            onTutup={() => setCaraMemindaiTerbuka(false)}
            accessibilityLabelTutup="Tutup panduan memindai QR"
          >
            <View style={styles.panduanSheet}>
              <Text style={styles.panduanTitle}>Panduan Scan QR</Text>
              <View style={styles.stepList}>
                <View style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNum}>1</Text>
                  </View>
                  <Text style={styles.panduanText}>
                    Pastikan status sesi sudah Dibuka.
                  </Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNum}>2</Text>
                  </View>
                  <Text style={styles.panduanText}>
                    Tekan Scan QR dan izinkan kamera serta GPS.
                  </Text>
                </View>
                <View style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNum}>3</Text>
                  </View>
                  <Text style={styles.panduanText}>
                    Arahkan kamera ke kode QR dari asisten.
                  </Text>
                </View>
              </View>
              <AppButton
                title="Mengerti"
                variant="primary"
                size="large"
                fullWidth
                onPress={() => setCaraMemindaiTerbuka(false)}
              />
            </View>
          </BottomSheet>
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
    padding: 20,
    justifyContent: 'center',
  },
  container: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 18,
  },
  sectionTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.light.text,
  },
  arsipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.warningSoft,
    borderWidth: 1,
    borderColor: '#F6DFB0',
  },
  arsipText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.light.warning,
  },
  rekapSection: {
    gap: 12,
  },
  rekapList: {
    gap: 10,
  },
  panduanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    alignSelf: 'center',
  },
  panduanLinkText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
    color: Colors.light.primary,
  },
  pressed: {
    opacity: 0.72,
  },
  panduanSheet: {
    gap: 16,
  },
  panduanTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 19,
    color: Colors.light.text,
  },
  stepList: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    color: Colors.light.primary,
  },
  panduanText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textSecondary,
  },
});
