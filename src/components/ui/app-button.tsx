import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { PressableScale } from '@/components/ui/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

type AppButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  ...pressableProps
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const buttonColors = {
    primary: {
      backgroundColor: Colors.light.primary,
      borderColor: Colors.light.primary,
      textColor: '#FFFFFF',
      shadow: Shadows.primaryGlow,
    },
    secondary: {
      backgroundColor: Colors.light.accentSoft,
      borderColor: Colors.light.accentSoft,
      textColor: Colors.light.accent,
      shadow: undefined,
    },
    outline: {
      backgroundColor: Colors.light.card,
      borderColor: Colors.light.border,
      textColor: Colors.light.text,
      shadow: Shadows.subtle,
    },
    danger: {
      backgroundColor: Colors.light.danger,
      borderColor: Colors.light.danger,
      textColor: '#FFFFFF',
      shadow: Shadows.subtle,
    },
  }[variant];

  return (
    <PressableScale
      {...pressableProps}
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={isDisabled}
      onPress={onPress}
      scaleTo={0.965}
      style={[fullWidth && styles.fullWidth, style]}
      contentStyle={[
        styles.button,
        styles[size],
        {
          backgroundColor: buttonColors.backgroundColor,
          borderColor: buttonColors.borderColor,
        },
        !isDisabled && buttonColors.shadow,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={buttonColors.textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: buttonColors.textColor }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  small: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: Radii.sm + 2,
  },
  medium: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: Radii.md,
  },
  large: {
    minHeight: 54,
    paddingHorizontal: 22,
    borderRadius: Radii.md + 2,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
});
