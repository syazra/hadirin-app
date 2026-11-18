import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { KategoriAiBadge } from '@/components/praktikan/kategori-ai-badge';
import { STATUS_IZIN } from '@/constants/status-izin';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useIzinPengguna } from '@/hooks/use-izin-pengguna';
import { DetailIzinAsisten } from '@/components/asisten/detail-izin-asisten';
import { useIzinAsisten } from '@/hooks/use-izin-asisten';

function formatTanggal(nilai: unknown): string {
  if (!nilai) return 'Belum tersedia';

  let tanggal: Date;

  if (nilai instanceof Date) {
    tanggal = nilai;
  } else if (
    typeof nilai === 'object' &&
    nilai !== null &&
    'toDate' in nilai &&
    typeof nilai.toDate === 'function'
  ) {
    tanggal = nilai.toDate();
  } else {
    tanggal = new Date(nilai as string | number);
  }

  if (Number.isNaN(tanggal.getTime())) return 'Belum tersedia';

  return tanggal.toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export default function DetailIzinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pengguna } = useAuth();

  const uid = pengguna?.uid ?? null;
  const { izin: izinPraktikan, loading: loadingPraktikan, error: errorPraktikan } = useIzinPengguna(
    pengguna?.peran === 'PRAKTIKAN' ? uid : null,
  );
  const { izin: izinAsisten, loading: loadingAsisten, error: errorAsisten } = useIzinAsisten(
    pengguna?.peran === 'ASISTEN' ? uid : null,
  );

  const izin = pengguna?.peran === 'ASISTEN' ? izinAsisten : izinPraktikan;
  const loading = pengguna?.peran === 'ASISTEN' ? loadingAsisten : loadingPraktikan;
  const error = pengguna?.peran === 'ASISTEN' ? errorAsisten : errorPraktikan;

  const dataIzin = useMemo(() => izin.find((item) => item.idIzin === id), [izin, id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.muted}>Memuat detail pengajuan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Gagal memuat detail izin.</Text>
        <Text style={styles.muted}>{error}</Text>
      </View>
    );
  }

  if (!dataIzin) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Pengajuan tidak ditemukan</Text>
        <Text style={styles.muted}>
          Data tidak tersedia atau bukan milik akun yang sedang login.
        </Text>
      </View>
    );
  }

  const status = STATUS_IZIN[dataIzin.statusIzin];
  if (pengguna?.peran === 'ASISTEN') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pemeriksaan Pengajuan Izin</Text>
          <Text style={styles.subtitle}>Periksa alasan dan tentukan keputusan izin praktikan.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status Pengajuan</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.label}>Waktu pengajuan</Text>
          <Text style={styles.value}>{formatTanggal(dataIzin.dibuatPada)}</Text>
          <Text style={styles.label}>Waktu pemeriksaan</Text>
          <Text style={styles.value}>{formatTanggal(dataIzin.waktuPeriksa)}</Text>
        </View>
        <DetailIzinAsisten izin={dataIzin} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Detail Pengajuan Izin</Text>
        <Text style={styles.subtitle}>
          Informasi pengajuan izin praktikum kamu
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Status Pengajuan</Text>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: status.background },
          ]}
        >
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>

        <Text style={styles.description}>
          {dataIzin.statusIzin === 'MENUNGGU'
            ? 'Pengajuan kamu sedang menunggu pemeriksaan asisten.'
            : dataIzin.statusIzin === 'DISETUJUI'
              ? 'Pengajuan izin kamu telah disetujui.'
              : 'Pengajuan izin kamu telah ditolak.'}
        </Text>

        {dataIzin.waktuPeriksa && (
          <>
            <Text style={styles.label}>Waktu Pemeriksaan</Text>
            <Text style={styles.value}>
              {formatTanggal(dataIzin.waktuPeriksa)}
            </Text>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informasi Praktikum</Text>

        <Text style={styles.label}>ID Sesi</Text>
        <Text style={styles.value}>{dataIzin.sesiId}</Text>

        <Text style={styles.label}>Tanggal Pengajuan</Text>
        <Text style={styles.value}>
          {formatTanggal(dataIzin.dibuatPada)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Alasan Izin</Text>
        <Text style={styles.value}>{dataIzin.alasan}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Hasil Klasifikasi AI</Text>
        <Text style={styles.label}>
          Status AI: {dataIzin.statusAi}
        </Text>

        <KategoriAiBadge
          kategori={dataIzin.kategoriAi}
          statusAi={dataIzin.statusAi}
        />

        <Text style={styles.note}>
          Klasifikasi AI hanya informasi pendukung dan bukan keputusan
          akhir pengajuan izin.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
    gap: 10,
    backgroundColor: Colors.light.background,
  },
  header: {
    gap: 6,
  },
  title: {
    color: Colors.light.text,
    fontSize: 23,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    gap: Spacing.two,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  value: {
    color: Colors.light.text,
    fontSize: 13,
    lineHeight: 20,
  },
  note: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  muted: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  error: {
    color: Colors.light.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
