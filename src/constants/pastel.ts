import { Colors } from '@/constants/theme';

export interface PastelTone {
  bg: string;
  fg: string;
}

const WARM_PASTEL_PALETTE: readonly PastelTone[] = [
  { bg: Colors.light.primarySoft, fg: Colors.light.primary },
  { bg: Colors.light.brandMidSoft, fg: Colors.light.brandMid },
  { bg: Colors.light.accentSoft, fg: Colors.light.accent },
  { bg: Colors.light.warmSoft, fg: Colors.light.warm },
  { bg: Colors.light.tealSoft, fg: Colors.light.teal },
  { bg: Colors.light.successSoft, fg: Colors.light.success },
];

export function getWarmPastelTone(seed: string): PastelTone {
  const clean = seed.trim();
  if (!clean) return WARM_PASTEL_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < clean.length; i += 1) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return WARM_PASTEL_PALETTE[hash % WARM_PASTEL_PALETTE.length];
}
