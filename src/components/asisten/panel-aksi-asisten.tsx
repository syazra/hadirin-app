import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { QrSesiPanel } from '@/components/asisten/qr-sesi-panel';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { Colors } from '@/constants/theme';
import { bukaSesi, tutupSesi } from '@/services/sesi-service';
import type { Sesi } from '@/types';

export interface PanelAksiAsistenProps {
    sesi: Sesi;
    kelasDiarsipkan?: boolean;
}

type AksiKonfirmasi = 'buka' | 'tutup' | null;

export function PanelAksiAsisten({
    sesi,
    kelasDiarsipkan = false,
}: PanelAksiAsistenProps) {
    const [aksiKonfirmasi, setAksiKonfirmasi] =
        useState<AksiKonfirmasi>(null);
    const [sedangProses, setSedangProses] = useState(false);
    const [pesanError, setPesanError] = useState<string | null>(null);

    const bolehBuka =
        sesi.statusSesi === 'BELUM_DIBUKA' &&
        !sesi.diarsipkan &&
        !kelasDiarsipkan;
    const bolehTutup = sesi.statusSesi === 'DIBUKA' && !sesi.diarsipkan;

    const konfirmasiAksi = async () => {
        if (sedangProses || !aksiKonfirmasi) {
            return;
        }

        const aksi = aksiKonfirmasi;
        setSedangProses(true);
        setPesanError(null);

        const hasil =
            aksi === 'buka'
                ? await bukaSesi(sesi.idSesi)
                : await tutupSesi(sesi.idSesi);

        setSedangProses(false);
        setAksiKonfirmasi(null);

        if (!hasil.ok) {
            setPesanError(hasil.pesan);
        }
    };

    return (
        <View style={styles.container}>
            {bolehBuka && (
                <Pressable
                    style={[
                        styles.button,
                        styles.bukaButton,
                        sedangProses && styles.buttonDisabled,
                    ]}
                    onPress={() => {
                        setPesanError(null);
                        setAksiKonfirmasi('buka');
                    }}
                    disabled={sedangProses}
                    accessibilityRole="button"
                >
                    {sedangProses ? (
                        <ActivityIndicator
                            size="small"
                            color={Colors.light.backgroundElement}
                        />
                    ) : (
                        <Text style={styles.buttonText}>Buka Sesi</Text>
                    )}
                </Pressable>
            )}

            {bolehTutup && (
                <Pressable
                    style={[
                        styles.button,
                        styles.tutupButton,
                        sedangProses && styles.buttonDisabled,
                    ]}
                    onPress={() => {
                        setPesanError(null);
                        setAksiKonfirmasi('tutup');
                    }}
                    disabled={sedangProses}
                    accessibilityRole="button"
                >
                    {sedangProses ? (
                        <ActivityIndicator
                            size="small"
                            color={Colors.light.backgroundElement}
                        />
                    ) : (
                        <Text style={styles.buttonText}>Tutup Sesi</Text>
                    )}
                </Pressable>
            )}

            {pesanError ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{pesanError}</Text>
                </View>
            ) : null}

            <QrSesiPanel
                sesi={sesi}
                kelasDiarsipkan={kelasDiarsipkan}
            />

            <ConfirmSheet
                visible={aksiKonfirmasi !== null}
                judul={
                    aksiKonfirmasi === 'buka'
                        ? 'Buka Sesi?'
                        : 'Tutup Sesi?'
                }
                pesan={
                    aksiKonfirmasi === 'buka'
                        ? 'Dengan membuka sesi, QR presensi akan tersedia agar praktikan dapat melakukan presensi.'
                        : 'Sesi akan ditutup. Praktikan tidak dapat melakukan presensi lagi.'
                }
                labelKonfirmasi={
                    sedangProses
                        ? 'Memproses...'
                        : aksiKonfirmasi === 'buka'
                          ? 'Ya, Buka Sesi Sekarang'
                          : 'Ya, Tutup Sesi'
                }
                labelBatal="Batal"
                onKonfirmasi={konfirmasiAksi}
                onBatal={() => {
                    if (!sedangProses) {
                        setAksiKonfirmasi(null);
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        gap: 12,
    },
    button: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    bukaButton: {
        backgroundColor: Colors.light.primary,
    },
    tutupButton: {
        backgroundColor: Colors.light.danger,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: Colors.light.backgroundElement,
        fontSize: 16,
        fontWeight: '600',
    },
    errorBox: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: Colors.light.backgroundElement,
        borderWidth: 1,
        borderColor: Colors.light.danger,
    },
    errorText: {
        fontSize: 13,
        lineHeight: 18,
        color: Colors.light.danger,
    },
});