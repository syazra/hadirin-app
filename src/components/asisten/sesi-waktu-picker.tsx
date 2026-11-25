import { type CSSProperties, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { SesiWaktuDialog } from '@/components/asisten/sesi-waktu-dialog';
import { IconCalendar, IconClock } from '@/components/ui/icons';
import { Colors, Fonts, Radii } from '@/constants/theme';

type ModePicker = 'date' | 'time';

type SesiWaktuPickerProps = {
  label: string;
  nilai: Date | null;
  nilaiAwal: Date;
  nonaktif: boolean;
  onUbah: (nilai: Date) => void;
  onKosongkan?: () => void;
};

const formatTanggal = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });
const formatJam = new Intl.DateTimeFormat('id-ID', { timeStyle: 'short', hourCycle: 'h23' });

function formatTanggalWaktuWeb(nilai: Date): string {
  const lokal = new Date(nilai.getTime() - nilai.getTimezoneOffset() * 60_000);
  return lokal.toISOString().slice(0, 16);
}

export function SesiWaktuPicker({
  label,
  nilai,
  nilaiAwal,
  nonaktif,
  onUbah,
  onKosongkan,
}: SesiWaktuPickerProps) {
  const [modePicker, setModePicker] = useState<ModePicker | null>(null);

  function bukaPicker(mode: ModePicker) {
    Keyboard.dismiss();
    setModePicker(mode);
  }

  return (
    <View style={styles.field}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {nilai && onKosongkan ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Kosongkan ${label.toLowerCase()}`}
            disabled={nonaktif}
            hitSlop={6}
            onPress={() => {
              setModePicker(null);
              onKosongkan();
            }}
          >
            <Text style={styles.clear}>Kosongkan</Text>
          </Pressable>
        ) : null}
      </View>

      {Platform.OS === 'web' ? (
        <input
          aria-label={label}
          type="datetime-local"
          disabled={nonaktif}
          value={nilai ? formatTanggalWaktuWeb(nilai) : ''}
          onChange={(event) => {
            const teks = event.currentTarget.value;
            if (!teks) {
              onKosongkan?.();
              return;
            }
            const tanggal = new Date(teks);
            if (Number.isFinite(tanggal.getTime())) onUbah(tanggal);
          }}
          style={webInputStyle}
        />
      ) : (
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pilih tanggal ${label.toLowerCase()}`}
            accessibilityValue={nilai ? { text: formatTanggal.format(nilai) } : undefined}
            disabled={nonaktif}
            onPress={() => bukaPicker('date')}
            style={[styles.trigger, nonaktif && styles.disabled]}
          >
            <IconCalendar size={18} color={Colors.light.primary} />
            <Text style={styles.value}>{nilai ? formatTanggal.format(nilai) : 'Pilih tanggal'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pilih jam ${label.toLowerCase()}`}
            accessibilityValue={nilai ? { text: formatJam.format(nilai) } : undefined}
            disabled={nonaktif}
            onPress={() => bukaPicker('time')}
            style={[styles.trigger, nonaktif && styles.disabled]}
          >
            <IconClock size={18} color={Colors.light.primary} />
            <Text style={styles.value}>{nilai ? formatJam.format(nilai) : 'Pilih jam'}</Text>
          </Pressable>
        </View>
      )}

      {modePicker && !nonaktif ? (
        <SesiWaktuDialog
          key={modePicker}
          mode={modePicker}
          nilai={nilai ?? nilaiAwal}
          onPilih={(dipilih) => {
            onUbah(dipilih);
            setModePicker(null);
          }}
          onBatal={() => setModePicker(null)}
        />
      ) : null}
    </View>
  );
}

const webInputStyle: CSSProperties = {
  minHeight: 48,
  border: `1.5px solid ${Colors.light.border}`,
  borderRadius: Radii.md,
  backgroundColor: Colors.light.backgroundElement,
  padding: '0 13px',
  color: Colors.light.text,
  fontSize: 14,
};

const styles = StyleSheet.create({
  field: { gap: 6 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flexShrink: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.light.text,
  },
  clear: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.light.primary,
  },
  row: { flexDirection: 'row', gap: 8 },
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 8,
    borderWidth: 1.5,
    borderRadius: Radii.md,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  value: {
    flexShrink: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.light.text,
  },
  disabled: { opacity: 0.55 },
});
