import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { PanelAksiAsisten } from '@/components/asisten/panel-aksi-asisten';
import { PanelAksiPraktikan } from '@/components/praktikan/panel-aksi-praktikan';
import { DetailSesi } from '@/components/shared/detail-sesi';
import { AppButton } from '@/components/ui/app-button';
import { InfoSheet } from '@/components/ui/info-sheet';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useSesiDetail } from '@/hooks/use-sesi-detail';

export default function DetailSesiScreen() {
    const { id } = useLocalSearchParams<{
        id?: string | string[];
    }>();

    const router = useRouter();
    const { pengguna, peran, loading: authLoading } = useAuth();
    const [caraMemindaiTerbuka, setCaraMemindaiTerbuka] = useState(false);

    const idSesi = Array.isArray(id) ? id[0] : id;
    const {
        sesi,
        kelas,
        loading: sesiLoading,
        error,
        muatUlang,
    } = useSesiDetail(idSesi ?? null);

    if (authLoading) {
        return (
            <View style={styles.centerBox}>
                <ActivityIndicator
                    size="large"
                    color={Colors.light.primary}
                />
                <Text style={styles.description}>Memuat sesi akun...</Text>
            </View>
        );
    }

    if (!pengguna) {
        return <Redirect href="/" />;
    }

    if (sesiLoading) {
        return (
            <View style={styles.centerBox}>
                <ActivityIndicator
                    size="large"
                    color={Colors.light.primary}
                />
                <Text style={styles.description}>Memuat detail sesi...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.container}
            >
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backText}>‹ Kembali</Text>
                </Pressable>

                <Text style={styles.title}>Gagal memuat detail sesi</Text>
                <Text style={styles.description}>{error}</Text>

                <AppButton
                    title="Coba Lagi"
                    fullWidth
                    onPress={muatUlang}
                />
            </ScrollView>
        );
    }

    if (!sesi) {
        return (
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.container}
            >
                <Text style={styles.title}>Sesi tidak ditemukan</Text>
                <Text style={styles.description}>
                    Data sesi yang kamu cari tidak tersedia atau tidak dapat
                    diakses.
                </Text>

                <Pressable onPress={() => router.back()}>
                    <Text style={styles.backText}>‹ Kembali</Text>
                </Pressable>
            </ScrollView>
        );
    }

    const dataDiarsipkan = Boolean(sesi.diarsipkan || kelas?.diarsipkan);
    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={false}
                    onRefresh={muatUlang}
                    tintColor={Colors.light.primary}
                />
            }
        >
            <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
            >
                <Text style={styles.backText}>‹ Kembali ke jadwal</Text>
            </Pressable>

            {dataDiarsipkan ? (
                <View style={styles.arsipBanner}>
                    <Text style={styles.arsipTitle}>Data Diarsipkan</Text>
                    <Text style={styles.arsipText}>
                        {kelas?.diarsipkan
                            ? 'Kelas induk telah diarsipkan. Perubahan jadwal, pembukaan sesi, presensi baru, dan pengajuan baru dinonaktifkan.'
                            : 'Sesi ini telah diarsipkan dan hanya tersedia sebagai riwayat.'}
                    </Text>
                </View>
            ) : null}

            <DetailSesi
                sesi={sesi}
                namaPraktikum={kelas?.namaPraktikum}
            />

            {peran === 'ASISTEN' && <PanelAksiAsisten sesi={sesi} />}

            {peran === 'PRAKTIKAN' && (
                <>
                    <PanelAksiPraktikan
                        statusSesi={sesi.statusSesi}
                        sudahPresensi={false}
                        waktuPresensi={undefined}
                        onPressPresensi={() =>
                            router.push({
                                pathname: '/scan-qr',
                                params: { idSesi: sesi.idSesi },
                            })
                        }
                    />

                    <AppButton
                        title="Cara memindai QR"
                        variant="outline"
                        fullWidth
                        onPress={() => setCaraMemindaiTerbuka(true)}
                    />

                    <InfoSheet
                        visible={caraMemindaiTerbuka}
                        judul="Cara memindai QR"
                        pesan={
                            '1. Pastikan sesi berstatus Dibuka.\n' +
                            '2. Tekan Scan QR pada halaman detail.\n' +
                            '3. Arahkan kamera ke kode QR yang ditampilkan asisten.'
                        }
                        labelTutup="Mengerti"
                        onTutup={() => setCaraMemindaiTerbuka(false)}
                    />
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    container: {
        padding: 20,
        paddingTop: 24,
        paddingBottom: 32,
        gap: 20,
    },
    centerBox: {
        flex: 1,
        backgroundColor: Colors.light.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.light.text,
    },
    description: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    backButton: {
        alignSelf: 'flex-start',
    },
    backText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    arsipBanner: {
        padding: 14,
        borderRadius: 12,
        backgroundColor: Colors.light.backgroundSelected,
        borderWidth: 1,
        borderColor: Colors.light.border,
        gap: 4,
    },
    arsipTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.text,
    },
    arsipText: {
        fontSize: 13,
        lineHeight: 19,
        color: Colors.light.textSecondary,
    },
});