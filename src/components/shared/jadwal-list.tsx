
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { SesiCard } from '@/components/shared/sesi-card';

type StatusSesi = 'BELUM_DIBUKA' | 'DIBUKA' | 'DITUTUP';

export type ItemJadwal = {
    idSesi: string;
    namaPraktikum: string;
    kelasLab: string;
    waktu: string;
    statusSesi: StatusSesi;
};

type JadwalListProps = {
    sesi: ItemJadwal[];
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
                    namaPraktikum={item.namaPraktikum}
                    kelasLab={item.kelasLab}
                    waktu={item.waktu}
                    statusSesi={item.statusSesi}
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
