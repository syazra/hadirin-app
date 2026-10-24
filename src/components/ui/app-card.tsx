import type { PropsWithChildren } from 'react';
import {
    Pressable,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

type AppCardProps = PropsWithChildren<{
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    disabled?: boolean;
}>;

export function AppCard({
    children,
    style,
    onPress,
    disabled = false,
}: AppCardProps) {
    const content = <View style={[styles.card, style]}>{children}</View>;

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                disabled={disabled}
                accessibilityRole="button"
                style={({ pressed }) => [
                    pressed && !disabled && styles.pressed,
                    disabled && styles.disabled,
                ]}
            >
                {content}
            </Pressable>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        gap: 12,
    },
    pressed: {
        opacity: 0.75,
    },
    disabled: {
        opacity: 0.5,
    },
});
