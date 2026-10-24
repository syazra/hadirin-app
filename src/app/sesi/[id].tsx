import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useApp } from '@/hooks/use-app';
import { PanelAksiAsisten } from '@/components/asisten/panel-aksi-asisten';

import { DetailSesi } from '@/components/shared/detail-sesi';

export default function DetailSesiScreen() {
    const { id, peran } = useLocalSearchParams<{
        id: string;
        peran?: 'ASISTEN' | 'PRAKTIKAN';
    }>();
    const router = useRouter();
    const { getSesiById } = useApp();

    const sesi = getSesiById(id);
    const kembaliKeJadwal = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        if (peran === 'ASISTEN') {
            router.replace('/(asisten)/jadwal-asisten');
        } else if (peran === 'PRAKTIKAN') {
            router.replace('/(praktikan)/jadwal-praktikan');
        } else {
            router.replace('/');
        }
    };

    if (!sesi) {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Sesi tidak ditemukan</Text>
                <Text style={styles.description}>
                    Data sesi yang kamu cari tidak tersedia.
                </Text>

                <Pressable onPress={kembaliKeJadwal}>
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
                onPress={kembaliKeJadwal}
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

            {peran === 'ASISTEN' && (
                <PanelAksiAsisten sesi={sesi} />
            )}
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
