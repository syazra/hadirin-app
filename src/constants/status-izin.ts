import { Colors } from '@/constants/theme';

export type StatusIzin = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';

export const STATUS_IZIN = {
  MENUNGGU: {
    label: 'Menunggu',
    color: Colors.light.warning,
    background: Colors.light.warningSoft,
  },
  DISETUJUI: {
    label: 'Disetujui',
    color: Colors.light.success,
    background: Colors.light.successSoft,
  },
  DITOLAK: {
    label: 'Ditolak',
    color: Colors.light.danger,
    background: Colors.light.dangerSoft,
  },
} as const;