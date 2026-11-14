import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/theme';
import { ambilKodeQr } from '@/services/sesi-service';
import type { Sesi } from '@/types';
import { buatPayloadQr } from '@/utils/qr-payload';

export interface QrSesiPanelProps {
    sesi: Sesi;
    kelasDiarsipkan?: boolean;
}

interface StateQr {
    sesiId: string;
    retryKey: number;
    kodeQr: string | null;
    loading: boolean;
    error: string | null;
}

export function QrSesiPanel({
    sesi,
    kelasDiarsipkan = false,
}: QrSesiPanelProps) {
    const [qrDiperbesar, setQrDiperbesar] = useState(false);
    const [stateQr, setStateQr] = useState<StateQr | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    const dataDiarsipkan = sesi.diarsipkan || kelasDiarsipkan;
    const sesiAktifDibuka = sesi.statusSesi === 'DIBUKA' && !dataDiarsipkan;

    const muatUlang = useCallback(() => {
        setRetryKey((prev) => prev + 1);
    }, []);

    useEffect(() => {
        if (!sesiAktifDibuka) {
            return;
        }

        const sesiIdAktif = sesi.idSesi;
        const retryAktif = retryKey;
        let aktif = true;

        ambilKodeQr(sesiIdAktif).then((hasil) => {
            if (!aktif) {
                return;
            }

            if (hasil.ok) {
                setStateQr({
                    sesiId: sesiIdAktif,
                    retryKey: retryAktif,
                    kodeQr: hasil.data,
                    loading: false,
                    error: null,
                });
            } else {
                setStateQr({
                    sesiId: sesiIdAktif,
                    retryKey: retryAktif,
                    kodeQr: null,
                    loading: false,
                    error: hasil.pesan,
                });
            }
        });

        return () => {
            aktif = false;
        };
    }, [sesi.idSesi, sesiAktifDibuka, retryKey]);

    const qrAktif =
        sesiAktifDibuka &&
        stateQr?.sesiId === sesi.idSesi &&
        stateQr.retryKey === retryKey
            ? stateQr
            : null;
    const loading = sesiAktifDibuka ? (qrAktif?.loading ?? true) : false;
    const kodeQr = qrAktif?.kodeQr ?? null;
    const error = qrAktif?.error ?? null;

    if (dataDiarsipkan) {
        return (
            <AppCard style={styles.card}>
                <Text style={styles.icon}>🔒</Text>
                <Text style={styles.title}>QR Presensi Tidak Tersedia</Text>
                <Text style={styles.message}>
                    {kelasDiarsipkan
                        ? 'Kelas sudah diarsipkan sehingga QR presensi tidak lagi aktif.'
                        : 'Sesi sudah diarsipkan sehingga QR presensi tidak tersedia.'}
                </Text>
            </AppCard>
        );
    }

    if (sesi.statusSesi === 'BELUM_DIBUKA') {
        return (
            <AppCard style={styles.card}>
                <Text style={styles.icon}>🔒</Text>
                <Text style={styles.title}>QR Presensi Belum Tersedia</Text>
                <Text style={styles.message}>
                    Sesi belum dibuka. QR presensi akan muncul otomatis
                    setelah sesi dibuka oleh Anda selaku Asisten.
                </Text>
            </AppCard>
        );
    }

    if (sesi.statusSesi === 'DITUTUP') {
        return (
            <AppCard style={styles.card}>
                <Text style={styles.icon}>🔒</Text>
                <Text style={styles.title}>Sesi Sudah Ditutup</Text>
                <Text style={styles.message}>
                    QR presensi sudah tidak tersedia. Praktikan tidak dapat
                    melakukan presensi lagi pada sesi ini.
                </Text>
            </AppCard>
        );
    }

    if (loading) {
        return (
            <AppCard style={styles.card}>
                <ActivityIndicator
                    size="large"
                    color={Colors.light.primary}
                />
                <Text style={styles.title}>Memuat QR Presensi...</Text>
                <Text style={styles.message}>
                    Mengambil kode QR rahasia sesi dari server.
                </Text>
            </AppCard>
        );
    }

    if (error || !kodeQr) {
        return (
            <AppCard style={styles.card}>
                <Text style={styles.icon}>⚠️</Text>
                <Text style={styles.title}>Gagal Memuat Kode QR</Text>
                <Text style={styles.message}>
                    {error ?? 'Kode QR sesi tidak tersedia.'}
                </Text>
                <Pressable
                    style={styles.button}
                    onPress={muatUlang}
                    accessibilityRole="button"
                >
                    <Text style={styles.buttonText}>Coba Lagi</Text>
                </Pressable>
            </AppCard>
        );
    }

    const payloadQr = buatPayloadQr(sesi.idSesi, kodeQr);

    return (
        <>
            <AppCard style={styles.card}>
                <Text style={styles.icon}>▦</Text>
                <Text style={styles.title}>QR Kode Presensi</Text>
                <Text style={styles.message}>
                    Minta praktikan memindai QR ini melalui aplikasi Hadir.in.
                </Text>

                <View style={styles.qrContainer}>
                    <QRCode
                        value={payloadQr}
                        size={200}
                        backgroundColor={Colors.light.card}
                        color={Colors.light.text}
                    />
                </View>

                <Pressable
                    style={styles.button}
                    onPress={() => setQrDiperbesar(true)}
                    accessibilityRole="button"
                >
                    <Text style={styles.buttonText}>Perbesar QR</Text>
                </Pressable>
            </AppCard>

            <Modal
                visible={qrDiperbesar && sesiAktifDibuka}
                animationType="slide"
                onRequestClose={() => setQrDiperbesar(false)}
            >
                <View style={styles.modalScreen}>
                    <Pressable
                        style={styles.closeButton}
                        onPress={() => setQrDiperbesar(false)}
                        accessibilityRole="button"
                    >
                        <Text style={styles.closeText}>‹ Kembali</Text>
                    </Pressable>

                    <Text style={styles.modalTitle}>QR Sesi Praktikum</Text>
                    <Text style={styles.message}>
                        Minta praktikan memindai QR ini melalui aplikasi
                        Hadir.in.
                    </Text>

                    <View style={styles.largeQrContainer}>
                        <QRCode
                            value={payloadQr}
                            size={260}
                            backgroundColor={Colors.light.card}
                            color={Colors.light.text}
                        />
                    </View>

                    <Pressable
                        style={styles.button}
                        onPress={() => setQrDiperbesar(false)}
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonText}>
                            Tutup Tampilan Penuh
                        </Text>
                    </Pressable>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
        gap: 16,
    },
    icon: {
        fontSize: 28,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        lineHeight: 21,
        color: Colors.light.textSecondary,
        textAlign: 'center',
    },
    qrContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: Colors.light.card,
        borderRadius: 12,
    },
    button: {
        minHeight: 48,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.light.primary,
    },
    buttonText: {
        color: Colors.light.backgroundElement,
        fontSize: 15,
        fontWeight: '600',
    },
    modalScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 20,
        backgroundColor: Colors.light.background,
    },
    closeButton: {
        alignSelf: 'flex-start',
        minHeight: 44,
        justifyContent: 'center',
    },
    closeText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        textAlign: 'center',
    },
    largeQrContainer: {
        padding: 24,
        borderRadius: 16,
        backgroundColor: Colors.light.card,
    },
});