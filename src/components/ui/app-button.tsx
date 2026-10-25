import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

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
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
};

export function AppButton({ title, onPress, variant = 'primary', size = 'medium', loading = false, disabled = false, fullWidth = false, style, textStyle, ...pressableProps }: AppButtonProps) {
    const isDisabled = disabled || loading;
    const buttonColors = {
        primary: {
            backgroundColor: Colors.light.primary,
            borderColor: Colors.light.primary,
            textColor: '#FFFFFF',
        },
        secondary: {
            backgroundColor: Colors.light.accentSoft,
            borderColor: Colors.light.accentSoft,
            textColor: Colors.light.accent,
        },
        outline: {
            backgroundColor: 'transparent',
            borderColor: Colors.light.border,
            textColor: Colors.light.primary,
        },
        danger: {
            backgroundColor: Colors.light.danger,
            borderColor: Colors.light.danger,
            textColor: '#FFFFFF',
        },
    }[variant];

    return (
        <Pressable {...pressableProps}
            accessibilityRole="button"
            accessibilityLabel={title}
            disabled={isDisabled}
            onPress={onPress}
            style={({ pressed }) => [styles.button, styles[size], { backgroundColor: buttonColors.backgroundColor, borderColor: buttonColors.borderColor },
            fullWidth && styles.fullWidth, isDisabled && styles.disabled, pressed && !isDisabled && styles.pressed, style]}>
            {loading ? <ActivityIndicator size="small" color={buttonColors.textColor} /> : (
                <Text style={[styles.label, { color: buttonColors.textColor }, textStyle]}>{title}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        minHeight: 44,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row'
    },
    small: { 
        minHeight: 36, 
        paddingHorizontal: 14, 
        borderRadius: 10 
    },
    medium: { 
        minHeight: 46, 
        paddingHorizontal: 18, 
        borderRadius: 14 
    },
    large: { 
        minHeight: 54, 
        paddingHorizontal: 22, 
        borderRadius: 16 
    },
    fullWidth: { 
        alignSelf: 'stretch' 
    },
    disabled: { 
        opacity: 0.5 
    },
    pressed: { 
        opacity: 0.82, 
        transform: [{ scale: 0.99 }] 
    },
    label: { 
        fontSize: 15, 
        fontWeight: '600', 
        letterSpacing: 0.1 
    },
});
