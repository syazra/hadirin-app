import { Colors } from '@/constants/theme';
import type { StatusIzin } from '@/types';

export { type StatusIzin };

export const STATUS_IZIN: Record<
  StatusIzin,
  { label: string; color: string; background: string }
> = {
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
};