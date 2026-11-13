import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormIzin } from '@/components/praktikan/form-izin';
import { Colors, Spacing } from '@/constants/theme';
import { useApp } from '@/hooks/use-app';
import type { Sesi } from '@/types';

export default function AjukanIzinScreen() {
  const { sesi } = useApp();
  const [sesiTerpilih, setSesiTerpilih] = useState<Sesi | null>(null);

  function kirimPengajuan(alasan: string) {
    Alert.alert(
      'Form siap diuji',
      `Alasan yang dimasukkan:\n\n${alasan}\n\nPengajuan belum disimpan karena integrasi service izin belum tersedia.`,
      [{ text: 'Mengerti' }],
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Ajukan Izin</Text>
        <Text style={styles.subtitle}>Pilih sesi praktikum yang ingin kamu ajukan izinnya, lalu tuliskan alasan dengan jelas.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pilih Sesi Praktikum</Text>

        {sesi.length > 0 ? (
          sesi.map((item) => {
            const terpilih = sesiTerpilih?.idSesi === item.idSesi;

            return (
              <Pressable
                key={item.idSesi}
                onPress={() => setSesiTerpilih(item)}
                style={[styles.sessionCard, terpilih && styles.sessionSelected]}
              >
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{item.namaPraktikum}</Text>
                  <Text style={styles.sessionDetail}>{item.kelasLab}</Text>
                  <Text style={styles.sessionDetail}>{item.waktu}</Text>
                </View>

                <View style={[styles.radio, terpilih && styles.radioSelected]}>
                  {terpilih ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Belum ada sesi praktikum tersedia.</Text>
        )}
      </View>

      {sesiTerpilih ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alasan Pengajuan</Text>
          <FormIzin
            namaSesi={sesiTerpilih.namaPraktikum}
            onSubmit={kirimPengajuan}
          />
        </View>
      ) : (
        <Text style={styles.hint}>Pilih salah satu sesi terlebih dahulu untuk mengisi alasan izin.</Text>
      )}
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
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    gap: Spacing.two,
  },
  sessionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
  },
  sessionInfo: {
    flex: 1,
    gap: 5,
  },
  sessionName: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '700',
  },
  sessionDetail: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.light.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  emptyText: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  hint: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});