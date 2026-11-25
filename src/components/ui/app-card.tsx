import type { PropsWithChildren } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { PressableScale } from '@/components/ui/motion';
import { Colors, Radii, Shadows } from '@/constants/theme';

type AppCardVariant = 'default' | 'soft' | 'flat';

type AppCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  variant?: AppCardVariant;
}>;

export function AppCard({
  children,
  style,
  onPress,
  disabled = false,
  variant = 'default',
}: AppCardProps) {
  const variantStyle =
    variant === 'soft'
      ? styles.soft
      : variant === 'flat'
        ? styles.flat
        : styles.elevated;

  const content = (
    <View style={[styles.card, variantStyle, style]}>{children}</View>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        scaleTo={0.98}
        accessibilityRole="button"
        style={disabled && styles.disabled}
      >
        {content}
      </PressableScale>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl - 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    gap: 12,
  },
  elevated: {
    backgroundColor: Colors.light.card,
    ...Shadows.card,
  },
  soft: {
    backgroundColor: Colors.light.backgroundElement,
  },
  flat: {
    backgroundColor: Colors.light.card,
  },
  disabled: {
    opacity: 0.5,
  },
});
