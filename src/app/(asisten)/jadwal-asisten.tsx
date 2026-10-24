
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { JadwalList } from '@/components/shared/jadwal-list';
import { useApp } from '@/hooks/use-app';

export default function JadwalAsistenScreen() {
    const router = useRouter();
    const { sesi } = useApp();

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
                sesi={sesi}
                onPilihSesi={(idSesi) =>
                    router.push({
                        pathname: '/sesi/[id]',
                        params: { id: idSesi, peran: 'ASISTEN' },
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
