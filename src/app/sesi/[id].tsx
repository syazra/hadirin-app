
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { DetailSesi } from '@/components/shared/detail-sesi';

const DATA_JADWAL = [
    {
        idSesi: 'S001',
        namaPraktikum: 'Praktikum Basis Data',
        kelasLab: 'Lab Informatika 1',
        waktu: 'Senin, 08.00–10.00 WIB',
        statusSesi: 'BELUM_DIBUKA' as const,
    },
    {
        idSesi: 'S002',
        namaPraktikum: 'Praktikum Struktur Data',
        kelasLab: 'Lab Informatika 2',
        waktu: 'Selasa, 10.00–12.00 WIB',
        statusSesi: 'DIBUKA' as const,
    },
    {
        idSesi: 'S003',
        namaPraktikum: 'Praktikum Pemrograman',
        kelasLab: 'Lab Informatika 1',
        waktu: 'Rabu, 13.00–15.00 WIB',
        statusSesi: 'DITUTUP' as const,
    },
];

export default function DetailSesiScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const sesi = DATA_JADWAL.find((item) => item.idSesi === id);

    if (!sesi) {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Sesi tidak ditemukan</Text>
                <Text style={styles.description}>
                    Data sesi yang kamu cari tidak tersedia.
                </Text>

                <Pressable onPress={() => router.back()}>
                    <Text style={styles.backText}>‹ Kembali</Text>
                </Pressable>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.container}
        >
            <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
            >
                <Text style={styles.backText}>‹ Kembali ke jadwal</Text>
            </Pressable>

            <DetailSesi
                namaPraktikum={sesi.namaPraktikum}
                kelasLab={sesi.kelasLab}
                waktu={sesi.waktu}
                statusSesi={sesi.statusSesi}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    container: {
        padding: 20,
        paddingTop: 24,
        paddingBottom: 32,
        gap: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
    },
    backButton: {
        alignSelf: 'flex-start',
    },
    backText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
});
