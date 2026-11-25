import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { Colors } from '@/constants/theme';

export type SesiWaktuDialogProps = {
  mode: 'date' | 'time';
  nilai: Date;
  onPilih: (nilai: Date) => void;
  onBatal: () => void;
};

export function SesiWaktuDialog({ mode, nilai, onPilih, onBatal }: SesiWaktuDialogProps) {
  const [draf, setDraf] = useState(nilai);

  return (
    <View style={styles.picker}>
      <DateTimePicker
        value={draf}
        mode={mode}
        display="spinner"
        locale="id_ID"
        accentColor={Colors.light.primary}
        themeVariant="light"
        onValueChange={(_, waktu) => {
          const pilihan = new Date(nilai);
          if (mode === 'date') {
            pilihan.setFullYear(waktu.getFullYear(), waktu.getMonth(), waktu.getDate());
          } else {
            pilihan.setHours(waktu.getHours(), waktu.getMinutes());
          }
          setDraf(pilihan);
        }}
      />
      <View style={styles.actions}>
        <AppButton title="Batal" variant="outline" onPress={onBatal} />
        <AppButton title="Pilih" onPress={() => onPilih(draf)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { paddingBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
});
