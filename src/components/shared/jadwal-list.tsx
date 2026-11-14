import { StyleSheet, View } from 'react-native';

import { SesiCard } from '@/components/shared/sesi-card';
import { EmptyState } from '@/components/ui/empty-state';
import type { Sesi } from '@/types';

type JadwalListProps = {
    sesi: Sesi[];
    onPilihSesi: (idSesi: string) => void;
};

export function JadwalList({
    sesi,
    onPilihSesi,
}: JadwalListProps) {
    if (sesi.length === 0) {
        return (
            <EmptyState
                judul="Belum ada jadwal"
                pesan="Jadwal praktikum akan muncul di sini jika sudah tersedia."
                emoji="📅"
            />
        );
    }

    return (
        <View style={styles.list}>
            {sesi.map((item) => (
                <SesiCard
                    key={item.idSesi}
                    sesi={item}
                    onPress={() => onPilihSesi(item.idSesi)}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: 12,
    },
});