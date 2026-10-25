import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { Colors, Spacing } from '@/constants/theme';
import type { Pengguna, Peran } from '@/types';

export interface IdentitasPickerProps {
  pengguna: Pengguna[];
  penggunaAktif: Pengguna | null;
  onPilihIdentitas: (idPengguna: string) => void;
  onGantiPeran: () => void;
}

const pilihanPeran: { peran: Peran; label: string }[] = [
  { peran: 'PRAKTIKAN', label: 'Praktikan' },
  { peran: 'ASISTEN', label: 'Asisten' },
];

export function IdentitasPicker({
  pengguna,
  penggunaAktif,
  onPilihIdentitas,
  onGantiPeran,
}: IdentitasPickerProps) {
  const [peran, setPeran] = useState<Peran | null>(null);
  const [idPengguna, setIdPengguna] = useState<string | null>(null);
  const daftarIdentitas = pengguna.filter((item) => item.peran === peran);
  const identitasTerpilih = daftarIdentitas.find((item) => item.idPengguna === idPengguna);

  function pilihPeran(peranBaru: Peran) {
    if (peranBaru !== peran) {
      setPeran(peranBaru);
      setIdPengguna(null);
    }
  }

  if (penggunaAktif) {
    return (
      <View style={styles.section}>
        <Text style={styles.heading}>Identitas aktif</Text>
        <View style={styles.identity}>
          <Text style={styles.name}>{penggunaAktif.nama}</Text>
          <Text style={styles.secondary}>
            {penggunaAktif.peran === 'ASISTEN' ? 'Asisten' : 'Praktikan'} · {penggunaAktif.idPengguna}
          </Text>
        </View>
        <AppButton title="Ganti peran / identitas" variant="outline" onPress={onGantiPeran} />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>1. Pilih peran</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Peran" style={styles.roles}>
          {pilihanPeran.map((item) => {
            const dipilih = peran === item.peran;

            return (
              <Pressable
                key={item.peran}
                accessibilityRole="radio"
                accessibilityLabel={item.label}
                accessibilityState={{ checked: dipilih }}
                onPress={() => pilihPeran(item.peran)}
                style={({ pressed }) => [styles.role, dipilih && styles.selected, pressed && styles.pressed]}
              >
                <View style={styles.row}>
                  <View style={[styles.radio, dipilih && styles.radioSelected]}>
                    {dipilih && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.name}>{item.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>2. Pilih identitas</Text>
        {!peran ? (
          <Text style={styles.secondary}>Pilih peran terlebih dahulu.</Text>
        ) : daftarIdentitas.length === 0 ? (
          <Text accessibilityLiveRegion="polite" style={styles.secondary}>
            Belum ada identitas untuk peran ini. Silakan pilih peran lain.
          </Text>
        ) : (
          <View accessibilityRole="radiogroup" accessibilityLabel="Identitas" style={styles.identities}>
            {daftarIdentitas.map((item) => {
              const dipilih = identitasTerpilih?.idPengguna === item.idPengguna;

              return (
                <Pressable
                  key={item.idPengguna}
                  accessibilityRole="radio"
                  accessibilityLabel={`${item.nama}, ${item.idPengguna}`}
                  accessibilityState={{ checked: dipilih }}
                  onPress={() => setIdPengguna(item.idPengguna)}
                  style={({ pressed }) => [styles.identity, styles.row, dipilih && styles.selected, pressed && styles.pressed]}
                >
                  <View style={styles.identityText}>
                    <Text style={styles.name}>{item.nama}</Text>
                    <Text style={styles.secondary}>{item.idPengguna}</Text>
                  </View>
                  <View style={[styles.radio, dipilih && styles.radioSelected]}>
                    {dipilih && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <AppButton
        title={peran === 'ASISTEN' ? 'Masuk sebagai Asisten' : peran === 'PRAKTIKAN' ? 'Masuk sebagai Praktikan' : 'Masuk'}
        size="large"
        fullWidth
        disabled={!identitasTerpilih}
        accessibilityState={{ disabled: !identitasTerpilih }}
        onPress={() => {
          if (identitasTerpilih) onPilihIdentitas(identitasTerpilih.idPengguna);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.four },
  section: { gap: Spacing.three },
  heading: { color: Colors.light.text, fontSize: 18, fontWeight: '600' },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  role: {
    flex: 1,
    minWidth: 130,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  identities: { gap: Spacing.two },
  identity: {
    minHeight: 72,
    padding: Spacing.three,
    gap: Spacing.one,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  identityText: { flex: 1, gap: Spacing.one },
  name: { color: Colors.light.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
  secondary: { color: Colors.light.textSecondary, fontSize: 14, lineHeight: 21 },
  selected: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primarySoft },
  radio: {
    width: 22,
    height: 22,
    flexShrink: 0,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.light.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.light.primary },
  pressed: { opacity: 0.75 },
});
