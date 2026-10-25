import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

type EmptyStateProps = {
    judul: string;
    pesan: string;
    emoji?: string;
};

export function EmptyState({
    judul,
    pesan,
    emoji = '📋',
}: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Text style={styles.emoji}>{emoji}</Text>
            </View>

            <Text style={styles.title}>{judul}</Text>
            <Text style={styles.message}>{pesan}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
        gap: 12,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.light.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 28,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.text,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        lineHeight: 21,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
});
