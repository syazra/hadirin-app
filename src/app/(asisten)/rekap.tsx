import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import { RekapItem } from '@/components/asisten/rekap-item';
import { LayarPersiapan } from '@/components/shared/layar-persiapan';
import { Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/hooks/use-app';
import { useRekapSesi } from '@/hooks/use-rekap-sesi';
import { RingkasanHadir } from '@/components/asisten/ringkasan-hadir';
import { EmptyState } from '@/components/ui/empty-state';

export default function RekapScreen() {
  const { sesi } = useApp();
  const [idSesi, setIdSesi] = useState(sesi[0]?.idSesi ?? '');
  const rekap = useRekapSesi(idSesi);
  const sesiAktif = sesi.find((item) => item.idSesi === idSesi);

  if (sesi.length === 0) {
    return (
      <LayarPersiapan
        judul="Rekap kehadiran"
        pesan="Belum ada sesi praktikum yang tersedia."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rekap Kehadiran</Text>
        <Text style={styles.subtitle}>
          Lihat daftar praktikan yang hadir pada setiap sesi.
        </Text>
      </View>

      <Text style={styles.label}>Pilih Sesi Praktikum</Text>
      <View style={styles.pilihanSesi}>
        {sesi.map((item) => (
          <Pressable
            key={item.idSesi}
            style={[
              styles.pilihan,
              idSesi === item.idSesi && styles.pilihanAktif,
            ]}
            onPress={() => setIdSesi(item.idSesi)}
          >
            <Text
              style={[
                styles.namaPilihan,
                idSesi === item.idSesi && styles.namaPilihanAktif,
              ]}
            >
              {item.namaPraktikum}
            </Text>
            <Text style={styles.waktuSesi}>{item.waktu}</Text>
          </Pressable>
        ))}
      </View>

      {sesiAktif && (
        <>
          <View style={styles.ringkasan}>
            <Text style={styles.namaSesi}>{sesiAktif.namaPraktikum}</Text>
            <Text style={styles.lokasi}>{sesiAktif.kelasLab}</Text>
          </View>
          <RingkasanHadir jumlahHadir={rekap.jumlahHadir} />
        </>
      )}

      <Text style={styles.label}>Daftar Kehadiran</Text>
      {rekap.daftarHadir.length > 0 ? (
        <View style={styles.daftar}>
          {rekap.daftarHadir.map((item) => (
            <RekapItem
              key={item.presensi.idPresensi}
              {...item}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          judul="Belum ada presensi"
          pesan="Belum ada praktikan yang tercatat hadir pada sesi ini."
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 32 },
  header: { gap: Spacing.two },
  title: { fontSize: 24, fontWeight: '700', color: Colors.light.text },
  subtitle: { fontSize: 14, lineHeight: 21, color: Colors.light.textSecondary },
  label: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  pilihanSesi: { gap: 10 },
  pilihan: {
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    gap: 5,
  },
  pilihanAktif: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
  },
  namaPilihan: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  namaPilihanAktif: { color: Colors.light.primary },
  waktuSesi: { fontSize: 12, color: Colors.light.textSecondary },
  ringkasan: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    gap: 5,
  },
  namaSesi: { fontSize: 18, fontWeight: '700', color: Colors.light.backgroundElement },
  lokasi: { fontSize: 13, color: Colors.light.backgroundElement },
  daftar: { gap: 10 },
});
