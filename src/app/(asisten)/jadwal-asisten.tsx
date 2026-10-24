
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { JadwalList } from '@/components/shared/jadwal-list';

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

export default function JadwalAsistenScreen() {
    const router = useRouter();

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Halo, Asisten!</Text>
                <Text style={styles.title}>Jadwal Praktikum</Text>
                <Text style={styles.description}>
                    Kelola sesi praktikum dan pantau statusnya di sini.
                </Text>
            </View>

            <JadwalList
                sesi={DATA_JADWAL}
                onPilihSesi={(idSesi) =>
                    router.push({
                        pathname: '/sesi/[id]',
                        params: { id: idSesi },
                    })
                }
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        padding: 20,
        paddingTop: 24,
        paddingBottom: 32,
        gap: 24,
    },
    header: {
        gap: 8,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111827',
    },
    description: {
        fontSize: 14,
        lineHeight: 21,
        color: '#6B7280',
    },
});
