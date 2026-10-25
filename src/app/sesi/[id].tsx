import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { PanelAksiAsisten } from '@/components/asisten/panel-aksi-asisten';
import { DetailSesi } from '@/components/shared/detail-sesi';
import { PanelAksiPraktikan } from '@/components/praktikan/panel-aksi-praktikan';
import { AppButton } from '@/components/ui/app-button';
import { InfoSheet } from '@/components/ui/info-sheet';
import { useApp } from '@/hooks/use-app';
import { formatWaktu } from '@/utils/format-waktu';
import { Colors } from '@/constants/theme';

export default function DetailSesiScreen() {
    const { id } = useLocalSearchParams<{
        id?: string | string[];
    }>();

    const router = useRouter();

    const {
        getSesiById,
        penggunaAktif,
        getPresensiBySesi,
    } = useApp();

    const [caraMemindaiTerbuka, setCaraMemindaiTerbuka] =
        useState(false);

    const idSesi = Array.isArray(id) ? id[0] : id;
    const sesi = idSesi ? getSesiById(idSesi) : undefined;

    if (!penggunaAktif) {
        return <Redirect href="/" />;
    }

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

    const presensiPraktikan =
        penggunaAktif.peran === 'PRAKTIKAN'
            ? getPresensiBySesi(sesi.idSesi).find(
                (presensi) =>
                    presensi.idPengguna === penggunaAktif.idPengguna,
            )
            : undefined;

    const waktuPresensi = presensiPraktikan
        ? formatWaktu(presensiPraktikan.waktuHadir)
        : undefined;

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

            {penggunaAktif.peran === 'ASISTEN' && (
                <PanelAksiAsisten sesi={sesi} />
            )}

            {penggunaAktif.peran === 'PRAKTIKAN' && (
                <>
                    <PanelAksiPraktikan
                        statusSesi={sesi.statusSesi}
                        sudahPresensi={Boolean(presensiPraktikan)}
                        waktuPresensi={waktuPresensi}
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
                            '3. Tekan Simulasi Scan pada halaman berikutnya.'
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
});
