import { Colors } from '@/constants/theme';
import type { StatusSesi } from '@/types';

export const STATUS_SESI = {
  BELUM_DIBUKA: {
    label: 'Belum dibuka',
    warna: Colors.light.warning,
    warnaLatar: Colors.light.warningSoft,
  },
  DIBUKA: {
    label: 'Dibuka',
    warna: Colors.light.success,
    warnaLatar: Colors.light.successSoft,
  },
  DITUTUP: {
    label: 'Ditutup',
    warna: Colors.light.danger,
    warnaLatar: Colors.light.dangerSoft,
  },
} as const satisfies Record<StatusSesi, { label: string; warna: string; warnaLatar: string }>;
