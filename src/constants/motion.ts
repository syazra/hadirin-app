export const MotionSprings = {
  press: {
    damping: 18,
    stiffness: 380,
    mass: 0.7,
  },
  gentle: {
    damping: 24,
    stiffness: 220,
    mass: 0.9,
  },
  bouncy: {
    damping: 13,
    stiffness: 260,
    mass: 0.75,
  },
} as const;

export const MotionDurations = {
  fast: 150,
  normal: 240,
  slow: 340,
  staggerStep: 45,
  maxStaggerIndex: 6,
} as const;

export function getStaggerDelay(index: number, baseDelay = 0): number {
  const clamped = Math.min(Math.max(index, 0), MotionDurations.maxStaggerIndex);
  return baseDelay + clamped * MotionDurations.staggerStep;
}
