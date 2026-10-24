import { StyleSheet, Text, View } from 'react-native';

export type StatusSesiBadge =
    | 'BELUM_DIBUKA'
    | 'DIBUKA'
    | 'DITUTUP';

type StatusBadgeProps = {
    status: StatusSesiBadge;
};

const STATUS_CONFIG = {
    BELUM_DIBUKA: {
        label: 'Belum dibuka',
        backgroundColor: '#F3F4F6',
        textColor: '#4B5563',
    },
    DIBUKA: {
        label: 'Dibuka',
        backgroundColor: '#DCFCE7',
        textColor: '#166534',
    },
    DITUTUP: {
        label: 'Ditutup',
        backgroundColor: '#FEE2E2',
        textColor: '#991B1B',
    },
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status];

    return (
        <View
            style={[
                styles.badge,
                { backgroundColor: config.backgroundColor },
            ]}
            accessibilityRole="text"
            accessibilityLabel={`Status sesi: ${config.label}`}
        >
            <Text style={[styles.label, { color: config.textColor }]}>
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
    },
});
