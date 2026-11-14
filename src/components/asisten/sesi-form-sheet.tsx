import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';
import type { Sesi } from '@/types';

export type NilaiFormSesi = {
    judul: string;
    lokasi: string;
    waktuMulai: Date;
    waktuSelesai: Date | null;
};

export interface SesiFormSheetProps {
    visible: boolean;
    mode: 'tambah' | 'ubah';
    sesiAwal?: Sesi | null;
    loading: boolean;
    errorPesan: string | null;
    onSubmit: (nilai: NilaiFormSesi) => void;
    onTutup: () => void;
}

function formatInputTanggalWaktu(tanggal: Date): string {
    const tahun = tanggal.getFullYear();
    const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
    const hari = String(tanggal.getDate()).padStart(2, '0');
    const jam = String(tanggal.getHours()).padStart(2, '0');
    const menit = String(tanggal.getMinutes()).padStart(2, '0');
    return `${tahun}-${bulan}-${hari} ${jam}:${menit}`;
}

function parseInputTanggalWaktu(teks: string): Date | null {
    const rapi = teks.trim();
    if (!rapi) return null;

    const cocok = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(rapi);
    if (!cocok) return null;

    const tahun = Number(cocok[1]);
    const bulan = Number(cocok[2]);
    const hari = Number(cocok[3]);
    const jam = Number(cocok[4]);
    const menit = Number(cocok[5]);

    const hasil = new Date(tahun, bulan - 1, hari, jam, menit, 0, 0);
    if (
        Number.isNaN(hasil.getTime()) ||
        hasil.getFullYear() !== tahun ||
        hasil.getMonth() !== bulan - 1 ||
        hasil.getDate() !== hari ||
        hasil.getHours() !== jam ||
        hasil.getMinutes() !== menit
    ) {
        return null;
    }

    return hasil;
}

function SesiFormSheetIsi({
    mode,
    sesiAwal,
    loading,
    errorPesan,
    onSubmit,
    onTutup,
}: Omit<SesiFormSheetProps, 'visible'>) {
    const [judul, setJudul] = useState(() =>
        mode === 'ubah' && sesiAwal ? sesiAwal.judul : '',
    );
    const [lokasi, setLokasi] = useState(() =>
        mode === 'ubah' && sesiAwal ? sesiAwal.lokasi : '',
    );
    const [waktuMulaiTeks, setWaktuMulaiTeks] = useState(() => {
        if (mode === 'ubah' && sesiAwal) {
            return formatInputTanggalWaktu(sesiAwal.waktuMulai);
        }
        const sekarang = new Date();
        sekarang.setSeconds(0, 0);
        return formatInputTanggalWaktu(sekarang);
    });
    const [waktuSelesaiTeks, setWaktuSelesaiTeks] = useState(() =>
        mode === 'ubah' && sesiAwal?.waktuSelesai
            ? formatInputTanggalWaktu(sesiAwal.waktuSelesai)
            : '',
    );
    const [errorLokal, setErrorLokal] = useState<string | null>(null);

    const handleKirim = () => {
        if (loading) return;

        const judulRapi = judul.trim();
        const lokasiRapi = lokasi.trim();

        if (!judulRapi) {
            setErrorLokal('Judul sesi wajib diisi.');
            return;
        }
        if (judulRapi.length > 100) {
            setErrorLokal('Judul sesi maksimal 100 karakter.');
            return;
        }
        if (!lokasiRapi) {
            setErrorLokal('Lokasi sesi wajib diisi.');
            return;
        }
        if (lokasiRapi.length > 100) {
            setErrorLokal('Lokasi sesi maksimal 100 karakter.');
            return;
        }

        const waktuMulai = parseInputTanggalWaktu(waktuMulaiTeks);
        if (!waktuMulai) {
            setErrorLokal(
                'Format waktu mulai harus YYYY-MM-DD HH:mm (contoh: 2026-11-14 13:00).',
            );
            return;
        }

        let waktuSelesai: Date | null = null;
        if (waktuSelesaiTeks.trim().length > 0) {
            waktuSelesai = parseInputTanggalWaktu(waktuSelesaiTeks);
            if (!waktuSelesai) {
                setErrorLokal(
                    'Format waktu selesai harus YYYY-MM-DD HH:mm atau kosongkan.',
                );
                return;
            }
            if (waktuSelesai.getTime() <= waktuMulai.getTime()) {
                setErrorLokal(
                    'Waktu selesai harus lebih besar dari waktu mulai.',
                );
                return;
            }
        }

        setErrorLokal(null);
        onSubmit({
            judul: judulRapi,
            lokasi: lokasiRapi,
            waktuMulai,
            waktuSelesai,
        });
    };

    const pesanError = errorLokal ?? errorPesan;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {mode === 'tambah' ? 'Tambah Sesi Baru' : 'Ubah Sesi'}
            </Text>

            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.formBody}
            >
                <View style={styles.field}>
                    <Text style={styles.label}>Judul Sesi</Text>
                    <TextInput
                        value={judul}
                        onChangeText={setJudul}
                        placeholder="Contoh: Pertemuan 3 — Modul Firestore"
                        placeholderTextColor={Colors.light.textSecondary}
                        maxLength={100}
                        editable={!loading}
                        style={styles.input}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Lokasi</Text>
                    <TextInput
                        value={lokasi}
                        onChangeText={setLokasi}
                        placeholder="Contoh: Lab Komputasi B"
                        placeholderTextColor={Colors.light.textSecondary}
                        maxLength={100}
                        editable={!loading}
                        style={styles.input}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>
                        Waktu Mulai (YYYY-MM-DD HH:mm)
                    </Text>
                    <TextInput
                        value={waktuMulaiTeks}
                        onChangeText={setWaktuMulaiTeks}
                        placeholder="2026-11-14 13:00"
                        placeholderTextColor={Colors.light.textSecondary}
                        editable={!loading}
                        style={styles.input}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>
                        Waktu Selesai (Opsional, YYYY-MM-DD HH:mm)
                    </Text>
                    <TextInput
                        value={waktuSelesaiTeks}
                        onChangeText={setWaktuSelesaiTeks}
                        placeholder="Kosongkan jika belum ditentukan"
                        placeholderTextColor={Colors.light.textSecondary}
                        editable={!loading}
                        style={styles.input}
                    />
                </View>

                {pesanError ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{pesanError}</Text>
                    </View>
                ) : null}
            </ScrollView>

            <View style={styles.actions}>
                <Pressable
                    disabled={loading}
                    onPress={onTutup}
                    style={[
                        styles.button,
                        styles.cancelButton,
                        loading && styles.disabled,
                    ]}
                    accessibilityRole="button"
                >
                    <Text style={styles.cancelText}>Batal</Text>
                </Pressable>

                <Pressable
                    disabled={loading}
                    onPress={handleKirim}
                    style={[
                        styles.button,
                        styles.submitButton,
                        loading && styles.disabled,
                    ]}
                    accessibilityRole="button"
                >
                    <Text style={styles.submitText}>
                        {loading
                            ? 'Menyimpan…'
                            : mode === 'tambah'
                              ? 'Simpan Sesi'
                              : 'Simpan Perubahan'}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

export function SesiFormSheet({
    visible,
    mode,
    sesiAwal = null,
    loading,
    errorPesan,
    onSubmit,
    onTutup,
}: SesiFormSheetProps) {
    return (
        <BottomSheet
            visible={visible}
            onTutup={() => {
                if (!loading) onTutup();
            }}
            nonaktifTutup={loading}
            denganKeyboard
            accessibilityLabelTutup="Tutup form sesi"
        >
            {visible ? (
                <SesiFormSheetIsi
                    key={`${mode}-${sesiAwal?.idSesi ?? 'baru'}`}
                    mode={mode}
                    sesiAwal={sesiAwal}
                    loading={loading}
                    errorPesan={errorPesan}
                    onSubmit={onSubmit}
                    onTutup={onTutup}
                />
            ) : null}
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
    },
    formBody: {
        gap: 14,
        paddingBottom: 8,
    },
    field: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.text,
    },
    input: {
        minHeight: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.background,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.light.text,
    },
    errorBox: {
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.light.danger,
        backgroundColor: '#FEE2E2',
    },
    errorText: {
        fontSize: 13,
        color: Colors.light.danger,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flex: 1,
        minHeight: 46,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.background,
    },
    submitButton: {
        backgroundColor: Colors.light.primary,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
    },
    submitText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.backgroundElement,
    },
    disabled: {
        opacity: 0.6,
    },
});