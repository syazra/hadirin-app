import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  BerandaMenuGrid,
  type BerandaMenuItem,
} from '@/components/shared/beranda-menu-grid';
import {
  PraktikumMendatangCard,
  type PraktikumMendatangItem,
} from '@/components/shared/praktikum-mendatang-card';
import {
  SesiAktifCard,
  SesiAktifKosongCard,
} from '@/components/shared/sesi-aktif-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useIzinAsisten } from '@/hooks/use-izin-asisten';
import { useJadwalAsisten } from '@/hooks/use-jadwal-asisten';
import { useKelasAsisten } from '@/hooks/use-kelas-asisten';
import { useRekapSesi } from '@/hooks/use-rekap-sesi';
import type { Sesi } from '@/types';

function formatRentangWaktuSesi(mulai: Date, selesai?: Date | string | null): string {
  const jamMulai = mulai
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(':', '.');
  if (!selesai) {
    return `${jamMulai} WIB`;
  }
  const waktuSelesai = new Date(selesai);
  if (Number.isNaN(waktuSelesai.getTime())) {
    return `${jamMulai} WIB`;
  }
  const jamSelesai = waktuSelesai
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(':', '.');
  return `${jamMulai}–${jamSelesai} WIB`;
}

function getHariSingkat(tanggal: Date): string {
  return tanggal
    .toLocaleDateString('id-ID', { weekday: 'short' })
    .replace('.', '');
}

function KartuSesiAktifAsisten({
  sesi,
  namaPraktikum,
  onPressKelola,
}: {
  sesi: Sesi;
  namaPraktikum: string;
  onPressKelola: () => void;
}) {
  const { jumlahHadir, totalPeserta } = useRekapSesi(
    sesi.idSesi,
    sesi.kelasId,
    sesi.statusSesi,
  );

  const sesiData = sesi as unknown as { waktuSelesai?: Date | string };

  return (
    <SesiAktifCard
      namaPraktikum={namaPraktikum}
      judul={sesi.judul}
      lokasi={sesi.lokasi}
      rentangWaktu={formatRentangWaktuSesi(
        new Date(sesi.waktuMulai),
        sesiData.waktuSelesai,
      )}
      infoKananAtas={`${jumlahHadir}/${totalPeserta} hadir`}
      labelTombol="Kelola sesi"
      onPressTombol={onPressKelola}
    />
  );
}

export default function BerandaAsistenScreen() {
  const router = useRouter();
  const { pengguna, loading: authLoading } = useAuth();
  const {
    sesi,
    loading: jadwalLoading,
    muatUlang,
  } = useJadwalAsisten(pengguna?.uid ?? null);
  const { kelas } = useKelasAsisten(pengguna?.uid ?? null, { sertakanArsip: true });
  const { izin } = useIzinAsisten(pengguna?.uid ?? null);

  const sedangMemuat = authLoading || jadwalLoading;

  const kelasById = Object.fromEntries(
    kelas.map((item) => [item.idKelas, item]),
  );

  const sesiAktifList = sesi.filter(
    (item) => !item.diarsipkan && item.statusSesi === 'DIBUKA',
  );

  const jumlahIzinMenunggu = izin.filter(
    (item) => item.statusIzin === 'MENUNGGU',
  ).length;

  const sekarang = new Date();
  const batasSatuMinggu = new Date();
  batasSatuMinggu.setDate(sekarang.getDate() + 7);

  const praktikumMendatangItems: PraktikumMendatangItem[] = sesi
    .filter((item) => {
      if (item.diarsipkan || item.statusSesi !== 'BELUM_DIBUKA') return false;
      const waktu = new Date(item.waktuMulai);
      return waktu >= sekarang && waktu <= batasSatuMinggu;
    })
    .sort((a, b) => new Date(a.waktuMulai).getTime() - new Date(b.waktuMulai).getTime())
    .map((item) => {
      const tanggalMulai = new Date(item.waktuMulai);
      const sesiData = item as unknown as { waktuSelesai?: Date | string };
      return {
        idSesi: item.idSesi,
        hariSingkat: getHariSingkat(tanggalMulai),
        angkaTanggal: tanggalMulai.getDate(),
        judul: item.judul,
        namaPraktikum: kelasById[item.kelasId]?.namaPraktikum,
        rentangWaktu: formatRentangWaktuSesi(tanggalMulai, sesiData.waktuSelesai),
        lokasi: item.lokasi,
      };
    });

  const menuItems: BerandaMenuItem[] = [
    {
      key: 'praktikum',
      label: 'Praktikum',
      bgTint: Colors.light.primarySoft,
      onPress: () => router.push('/(asisten)/kelas'),
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.light.primary} strokeWidth={2.0}>
          <Path d="M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Zm5 15h8m-4-4v4" />
        </Svg>
      ),
    },
    {
      key: 'jadwal',
      label: 'Jadwal',
      bgTint: Colors.light.primarySoft,
      onPress: () => router.push('/(asisten)/jadwal-asisten'),
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.light.primary} strokeWidth={1.8}>
          <Path d="M7 3v4m10-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 9h3m4 0h1" />
        </Svg>
      ),
    },
    {
      key: 'rekap',
      label: 'Rekap',
      bgTint: Colors.light.primarySoft,
      onPress: () => router.push('/(asisten)/rekap'),
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.light.primary} strokeWidth={1.8}>
          <Path d="M9 5H5v16h14V5h-4M9 3h6v4H9V3Zm-2 9h10M7 16h10" />
        </Svg>
      ),
    },
    {
      key: 'izin',
      label: 'Izin',
      bgTint: Colors.light.accentSoft,
      badge: jumlahIzinMenunggu,
      onPress: () => router.push('/(asisten)/izin-asisten'),
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.light.accent} strokeWidth={2}>
          <Path d="m5 13 4 4L19 7" />
        </Svg>
      ),
    },
    {
      key: 'peta',
      label: 'Peta',
      bgTint: Colors.light.primarySoft,
      onPress: () => router.push('/(asisten)/maps'),
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.light.primary} strokeWidth={1.8}>
          <Path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15" />
        </Svg>
      ),
    },
    {
      key: 'lab',
      label: 'Lab',
      bgTint: Colors.light.primarySoft,
      onPress: () => router.push('/(asisten)/laboratorium'),
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.light.primary} strokeWidth={1.8}>
          <Path d="M9 3h6m-5 0v7l-5 9a1 1 0 0 0 1 2h12a1 1 0 0 0 1-2l-5-9V3M8 15h8" />
        </Svg>
      ),
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={muatUlang}
          tintColor={Colors.light.primary}
        />
      }
    >
      {/* 1. Kartu Sesi Aktif */}
      {sedangMemuat ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      ) : sesiAktifList.length > 0 ? (
        <View style={styles.activeSessionList}>
          {sesiAktifList.map((item) => (
            <KartuSesiAktifAsisten
              key={item.idSesi}
              sesi={item}
              namaPraktikum={kelasById[item.kelasId]?.namaPraktikum ?? 'Praktikum'}
              onPressKelola={() =>
                router.push({
                  pathname: '/sesi/[id]',
                  params: { id: item.idSesi },
                })
              }
            />
          ))}
        </View>
      ) : (
        <SesiAktifKosongCard />
      )}

      {/* 2. Banner Izin Menunggu */}
      <Pressable
        style={({ pressed }) => [
          styles.izinBanner,
          pressed && styles.cardPressed,
        ]}
        onPress={() => router.push('/(asisten)/izin-asisten')}
      >
        <View style={styles.izinIconCircle}>
          <Text style={styles.izinExclamation}>!</Text>
        </View>
        <View style={styles.izinContent}>
          <Text style={styles.izinTitle}>
            {jumlahIzinMenunggu > 0
              ? `${jumlahIzinMenunggu} izin menunggu`
              : 'Tidak ada izin menunggu'}
          </Text>
          <Text style={styles.izinSubtitle}>
            {jumlahIzinMenunggu > 0
              ? 'Perlu diperiksa'
              : 'Semua pengajuan izin sudah diproses'}
          </Text>
        </View>
        <Svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke={Colors.light.accent}
          strokeWidth={2.2}
        >
          <Path d="m9 6 6 6-6 6" />
        </Svg>
      </Pressable>

      {/* 3. Section Menu (Grid 3x2) */}
      <BerandaMenuGrid items={menuItems} columns={3} />

      {/* 4. Section Praktikum Mendatang */}
      <PraktikumMendatangCard
        items={praktikumMendatangItems}
        onPressItem={(idSesi) =>
          router.push({
            pathname: '/sesi/[id]',
            params: { id: idSesi },
          })
        }
        onPressLihatSemua={() => router.push('/(asisten)/jadwal-asisten')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
    flexGrow: 1,
  },
  loadingCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activeSessionList: {
    gap: Spacing.three,
  },
  izinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.accentSoft,
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 14,
  },
  izinIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  izinExclamation: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 20,
    color: Colors.light.accent,
  },
  izinContent: {
    flex: 1,
  },
  izinTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.light.text,
    marginBottom: 2,
  },
  izinSubtitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.accent,
  },
  cardPressed: {
    opacity: 0.9,
  },
});