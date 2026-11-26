import { DatePickerDialog, Host, TimePickerDialog } from '@expo/ui/jetpack-compose';

import type { SesiWaktuDialogProps } from '@/components/asisten/sesi-waktu-dialog';
import { Colors } from '@/constants/theme';

export function SesiWaktuDialog({ mode, nilai, onPilih, onBatal }: SesiWaktuDialogProps) {
  const propsDialog = {
    color: Colors.light.primary,
    confirmButtonLabel: 'Pilih',
    dismissButtonLabel: 'Batal',
    onDismissRequest: onBatal,
  };

  return (
    <Host colorScheme="light">
      {mode === 'date' ? (
        <DatePickerDialog
          {...propsDialog}
          initialDate={new Date(
            Date.UTC(nilai.getFullYear(), nilai.getMonth(), nilai.getDate()),
          ).toISOString()}
          showVariantToggle={false}
          onDateSelected={(tanggalUtc) => {
            // Kalender Android mengembalikan hari yang dipilih sebagai tengah malam UTC.
            const tanggal = new Date(nilai);
            tanggal.setFullYear(
              tanggalUtc.getUTCFullYear(),
              tanggalUtc.getUTCMonth(),
              tanggalUtc.getUTCDate(),
            );
            onPilih(tanggal);
          }}
        />
      ) : (
        <TimePickerDialog
          {...propsDialog}
          initialDate={nilai.toISOString()}
          is24Hour
          onDateSelected={onPilih}
        />
      )}
    </Host>
  );
}
