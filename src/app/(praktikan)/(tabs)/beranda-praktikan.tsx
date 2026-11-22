import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
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
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useJadwalPraktikan } from '@/hooks/use-jadwal-praktikan';
import { getFirebaseServices } from '@/lib/firebase';

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

export default function BerandaPraktikanScreen() {
  const router = useRouter();
  const { pengguna, loading: authLoading } = useAuth();
  const {
    sesi,
    loading: jadwalLoading,
    muatUlang,
  } = useJadwalPraktikan(pengguna?.uid ?? null);

  const [cacheNamaKelas, setCacheNamaKelas] = useState<{
    uid: string;
    map: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    const uid = pengguna?.uid;
    const unikKelasIds = Array.from(
      new Set(sesi.map((item) => item.kelasId).filter(Boolean))
    );

    if (!uid || unikKelasIds.length === 0) {
      return;
    }

    let aktif = true;
    const { db } = getFirebaseServices();

    async function muatNamaKelas(userUid: string) {
      const hasilMap: Record<string, string> = {};

      try {
        const qKeanggotaan = query(
          collection(db, 'keanggotaan'),
          where('uid', '==', userUid)
        );
        const snapAnggota = await getDocs(qKeanggotaan);
        snapAnggota.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const idKelas =
            typeof data.kelasId === 'string' ? data.kelasId : '';
          const nama =
            typeof data.namaPraktikum === 'string'
              ? data.namaPraktikum
              : typeof data.namaKelas === 'string'
                ? data.namaKelas
                : '';
          if (idKelas && nama) {
            hasilMap[idKelas] = nama;
          }
        });
      } catch {
        // Lanjut ke pembacaan dokumen kelas langsung
      }

      const sisaKelasIds = unikKelasIds.filter((id) => !hasilMap[id]);
      if (sisaKelasIds.length > 0) {
        await Promise.all(
          sisaKelasIds.map(async (kelasId) => {
            try {
              const kelasSnap = await getDoc(doc(db, 'kelas', kelasId));
              if (kelasSnap.exists()) {
                const data = kelasSnap.data();
                const nama =
                  typeof data?.namaPraktikum === 'string'
                    ? data.namaPraktikum
                    : typeof data?.namaKelas === 'string'
                      ? data.namaKelas
                      : typeof data?.nama === 'string'
                        ? data.nama
                        : '';
                if (nama) {
                  hasilMap[kelasId] = nama;
                }
              }
            } catch {
              // Abaikan jika satu dokumen gagal dibaca
            }
          })
        );
      }

      if (aktif) {
        setCacheNamaKelas({ uid: userUid, map: hasilMap });
      }
    }

    void muatNamaKelas(uid);

    return () => {
      aktif = false;
    };
  }, [pengguna?.uid, sesi]);

  const namaKelasById =
    pengguna?.uid && cacheNamaKelas?.uid === pengguna.uid
      ? cacheNamaKelas.map
      : {};

  const sedangMemuat = authLoading || jadwalLoading;

  const sesiAktifList = sesi.filter(
    (item) => !item.diarsipkan && item.statusSesi === 'DIBUKA'
  );

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
      const sesiData = item as unknown as {
        waktuSelesai?: Date | string;
        namaPraktikum?: string;
      };
      return {
        idSesi: item.idSesi,
        hariSingkat: getHariSingkat(tanggalMulai),
        angkaTanggal: tanggalMulai.getDate(),
        judul: item.judul,
        namaPraktikum: namaKelasById[item.kelasId] ?? sesiData.namaPraktikum,
        rentangWaktu: formatRentangWaktuSesi(tanggalMulai, sesiData.waktuSelesai),
        lokasi: item.lokasi,
      };
    });

  const menuItems: BerandaMenuItem[] = [
    {
      key: 'praktikum',
      label: 'Praktikum',
      bgTint: Colors.light.primarySoft,
      onPress: () => router.push('/(praktikan)/jadwal-praktikan'),
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.light.primary} strokeWidth={2.0}>
          <Path d="M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Zm5 15h8m-4-4v4" />
        </Svg>
      ),
    },
    {
      key: 'riwayat',
      label: 'Riwayat',
      bgTint: Colors.light.primarySoft,
      onPress: () => router.push('/(praktikan)/riwayat'),
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
      onPress: () => router.push('/(praktikan)/izin-praktikan'),
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
      onPress: () => router.push('/(praktikan)/maps'),
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.light.primary} strokeWidth={1.8}>
          <Path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15" />
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
          {sesiAktifList.map((item) => {
            const sesiData = item as unknown as {
              waktuSelesai?: Date | string;
              namaPraktikum?: string;
            };
            const namaPraktikum =
              namaKelasById[item.kelasId] ?? sesiData.namaPraktikum ?? 'Praktikum';

            return (
              <SesiAktifCard
                key={item.idSesi}
                namaPraktikum={namaPraktikum}
                judul={item.judul}
                lokasi={item.lokasi}
                rentangWaktu={formatRentangWaktuSesi(
                  new Date(item.waktuMulai),
                  sesiData.waktuSelesai
                )}
                labelTombol="Detail Sesi"
                onPressTombol={() =>
                  router.push({
                    pathname: '/sesi/[id]',
                    params: { id: item.idSesi },
                  })
                }
              />
            );
          })}
        </View>
      ) : (
        <SesiAktifKosongCard />
      )}

      {/* 2. Section Menu (4 Fitur) */}
      <BerandaMenuGrid items={menuItems} columns={4} />

      {/* 3. Section Praktikum Mendatang */}
      <PraktikumMendatangCard
        items={praktikumMendatangItems}
        onPressItem={(idSesi) =>
          router.push({
            pathname: '/sesi/[id]',
            params: { id: idSesi },
          })
        }
        onPressLihatSemua={() => router.push('/(praktikan)/jadwal-praktikan')}
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
});