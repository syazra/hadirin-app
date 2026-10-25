import { StyleSheet, Text, View } from 'react-native';

import { STATUS_SESI } from '@/constants/status-sesi';
import type { StatusSesi } from '@/types';

export type StatusSesiBadge = StatusSesi;

type StatusBadgeProps = {
    status: StatusSesiBadge;
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = STATUS_SESI[status];

    return (
        <View
            style={[
                styles.badge,
                { backgroundColor: config.warnaLatar },
            ]}
            accessibilityRole="text"
            accessibilityLabel={`Status sesi: ${config.label}`}
        >
            <Text style={[styles.label, { color: config.warna }]}>
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
