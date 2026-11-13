import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';
import {
    FieldErrorSesi,
    MAKS_TEKS_SESI,
    validasiSesi,
} from '@/utils/validasi-sesi';
import { useRef, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export type NilaiSesiForm = {
    judul: string;
    lokasi: string;
    waktuMulai: Date;
    waktuSelesai: Date | null;
};

type SesiFormSheetProps = {
    visible: boolean;
    mode?: 'tambah' | 'ubah';
    nilaiAwal?: NilaiSesiForm;
    loading?: boolean;
    errorPesan?: string | null;
    onSubmit: (data: NilaiSesiForm) => void;
    onTutup: () => void;
};

function formatTanggalInput(date: Date): string {
    const tahun = date.getFullYear();
    const bulan = String(date.getMonth() + 1).padStart(2, '0');
    const hari = String(date.getDate()).padStart(2, '0');
    return `${tahun}-${bulan}-${hari}`;
}

function formatJamInput(date: Date): string {
    const jam = String(date.getHours()).padStart(2, '0');
    const menit = String(date.getMinutes()).padStart(2, '0');
    return `${jam}:${menit}`;
}

function parseTanggalJam(tanggalStr: string, jamStr: string): Date | null {
    const matchTgl = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggalStr.trim());
    const matchJam = /^(\d{2}):(\d{2})$/.exec(jamStr.trim());
    if (!matchTgl || !matchJam) return null;

    const tahun = Number(matchTgl[1]);
    const bulan = Number(matchTgl[2]);
    const hari = Number(matchTgl[3]);
    const jam = Number(matchJam[1]);
    const menit = Number(matchJam[2]);

    if (bulan < 1 || bulan > 12 || hari < 1 || hari > 31 || jam > 23 || menit > 59) {
        return null;
    }

    const hasil = new Date(tahun, bulan - 1, hari, jam, menit, 0, 0);
    if (
        hasil.getFullYear() !== tahun ||
        hasil.getMonth() !== bulan - 1 ||
        hasil.getDate() !== hari
    ) {
        return null;
    }
    return hasil;
}

export function SesiFormSheet({
    visible,
    mode = 'tambah',
    nilaiAwal,
    loading = false,
    errorPesan = null,
    onSubmit,
    onTutup,
}: SesiFormSheetProps) {
    const defaultMulai = nilaiAwal?.waktuMulai ?? new Date();

    const [judul, setJudul] = useState(nilaiAwal?.judul ?? '');
    const [lokasi, setLokasi] = useState(nilaiAwal?.lokasi ?? '');
    const [tglMulai, setTglMulai] = useState(formatTanggalInput(defaultMulai));
    const [jamMulai, setJamMulai] = useState(formatJamInput(defaultMulai));
    const [tglSelesai, setTglSelesai] = useState(
        nilaiAwal?.waktuSelesai ? formatTanggalInput(nilaiAwal.waktuSelesai) : '',
    );
    const [jamSelesai, setJamSelesai] = useState(
        nilaiAwal?.waktuSelesai ? formatJamInput(nilaiAwal.waktuSelesai) : '',
    );
    const [errorLokal, setErrorLokal] = useState<{
        field?: FieldErrorSesi;
        pesan: string;
    } | null>(null);

    const inputJudulRef = useRef<TextInput>(null);
    const [prevVisible, setPrevVisible] = useState(visible);
    const [prevNilaiAwal, setPrevNilaiAwal] = useState(nilaiAwal);

    if (visible !== prevVisible || nilaiAwal !== prevNilaiAwal) {
        setPrevVisible(visible);
        setPrevNilaiAwal(nilaiAwal);
        if (visible) {
            const mulai = nilaiAwal?.waktuMulai ?? new Date();
            setJudul(nilaiAwal?.judul ?? '');
            setLokasi(nilaiAwal?.lokasi ?? '');
            setTglMulai(formatTanggalInput(mulai));
            setJamMulai(formatJamInput(mulai));
            setTglSelesai(
                nilaiAwal?.waktuSelesai ? formatTanggalInput(nilaiAwal.waktuSelesai) : '',
            );
            setJamSelesai(
                nilaiAwal?.waktuSelesai ? formatJamInput(nilaiAwal.waktuSelesai) : '',
            );
            setErrorLokal(null);
        }
    }

    const pesanError = errorLokal?.pesan ?? errorPesan;

    const kirim = () => {
        if (loading) return;

        const waktuMulai = parseTanggalJam(tglMulai, jamMulai);
        if (!waktuMulai) {
            setErrorLokal({
                field: 'waktuMulai',
                pesan: 'Format waktu mulai harus YYYY-MM-DD dan HH:MM yang valid.',
            });
            return;
        }

        const isiTglSelesai = tglSelesai.trim();
        const isiJamSelesai = jamSelesai.trim();
        let waktuSelesai: Date | null = null;

        if (isiTglSelesai.length > 0 || isiJamSelesai.length > 0) {
            const targetTglSelesai = isiTglSelesai.length > 0 ? isiTglSelesai : tglMulai;
            const parsedSelesai = parseTanggalJam(targetTglSelesai, isiJamSelesai);
            if (!parsedSelesai) {
                setErrorLokal({
                    field: 'waktuSelesai',
                    pesan: 'Format waktu selesai harus YYYY-MM-DD dan HH:MM yang valid.',
                });
                return;
            }
            waktuSelesai = parsedSelesai;
        }

        const hasil = validasiSesi(judul, lokasi, waktuMulai, waktuSelesai);
        if (!hasil.valid) {
            setErrorLokal({ field: hasil.field, pesan: hasil.pesan });
            return;
        }

        setErrorLokal(null);
        onSubmit(hasil.data);
    };

    const judulModal = mode === 'tambah' ? 'Tambah sesi' : 'Ubah sesi';
    const labelSimpan = mode === 'tambah' ? 'Simpan sesi' : 'Simpan perubahan';

    return (
        <BottomSheet
            visible={visible}
            onTutup={onTutup}
            nonaktifTutup={loading}
            denganKeyboard
            onSetelahTampil={() => inputJudulRef.current?.focus()}
            accessibilityLabelTutup="Tutup form sesi"
        >
            <Text style={styles.judul} accessibilityRole="header">
                {judulModal}
            </Text>

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.label}>Judul / nama praktikum</Text>
                <TextInput
                    ref={inputJudulRef}
                    value={judul}
                    onChangeText={(teks) => {
                        setJudul(teks);
                        if (errorLokal) setErrorLokal(null);
                    }}
                    editable={!loading}
                    maxLength={MAKS_TEKS_SESI}
                    placeholder="Contoh: Pertemuan 3 - Firebase Auth"
                    placeholderTextColor={Colors.light.textSecondary}
                    accessibilityLabel="Judul sesi"
                    style={[
                        styles.input,
                        errorLokal?.field === 'judul' && styles.inputError,
                        loading && styles.inputNonaktif,
                    ]}
                />

                <Text style={styles.label}>Lokasi</Text>
                <TextInput
                    value={lokasi}
                    onChangeText={(teks) => {
                        setLokasi(teks);
                        if (errorLokal) setErrorLokal(null);
                    }}
                    editable={!loading}
                    maxLength={MAKS_TEKS_SESI}
                    placeholder="Contoh: Lab Komputasi E103"
                    placeholderTextColor={Colors.light.textSecondary}
                    accessibilityLabel="Lokasi sesi"
                    style={[
                        styles.input,
                        errorLokal?.field === 'lokasi' && styles.inputError,
                        loading && styles.inputNonaktif,
                    ]}
                />

                <Text style={styles.label}>Waktu mulai (YYYY-MM-DD & HH:MM)</Text>
                <View style={styles.barisInput}>
                    <TextInput
                        value={tglMulai}
                        onChangeText={(teks) => {
                            setTglMulai(teks);
                            if (errorLokal) setErrorLokal(null);
                        }}
                        editable={!loading}
                        maxLength={10}
                        placeholder="2026-11-14"
                        placeholderTextColor={Colors.light.textSecondary}
                        keyboardType="numbers-and-punctuation"
                        accessibilityLabel="Tanggal mulai"
                        style={[
                            styles.input,
                            styles.inputTanggal,
                            errorLokal?.field === 'waktuMulai' && styles.inputError,
                            loading && styles.inputNonaktif,
                        ]}
                    />
                    <TextInput
                        value={jamMulai}
                        onChangeText={(teks) => {
                            setJamMulai(teks);
                            if (errorLokal) setErrorLokal(null);
                        }}
                        editable={!loading}
                        maxLength={5}
                        placeholder="08:00"
                        placeholderTextColor={Colors.light.textSecondary}
                        keyboardType="numbers-and-punctuation"
                        accessibilityLabel="Jam mulai"
                        style={[
                            styles.input,
                            styles.inputJam,
                            errorLokal?.field === 'waktuMulai' && styles.inputError,
                            loading && styles.inputNonaktif,
                        ]}
                    />
                </View>

                <View style={styles.labelBaris}>
                    <Text style={styles.labelOpsional}>
                        Waktu selesai (opsional)
                    </Text>
                    {tglSelesai.length > 0 || jamSelesai.length > 0 ? (
                        <Pressable
                            onPress={() => {
                                setTglSelesai('');
                                setJamSelesai('');
                                if (errorLokal) setErrorLokal(null);
                            }}
                            disabled={loading}
                            accessibilityRole="button"
                            accessibilityLabel="Kosongkan waktu selesai"
                        >
                            <Text style={styles.kosongkanTeks}>Kosongkan</Text>
                        </Pressable>
                    ) : null}
                </View>
                <View style={styles.barisInput}>
                    <TextInput
                        value={tglSelesai}
                        onChangeText={(teks) => {
                            setTglSelesai(teks);
                            if (errorLokal) setErrorLokal(null);
                        }}
                        editable={!loading}
                        maxLength={10}
                        placeholder="2026-11-14"
                        placeholderTextColor={Colors.light.textSecondary}
                        keyboardType="numbers-and-punctuation"
                        accessibilityLabel="Tanggal selesai"
                        style={[
                            styles.input,
                            styles.inputTanggal,
                            errorLokal?.field === 'waktuSelesai' && styles.inputError,
                            loading && styles.inputNonaktif,
                        ]}
                    />
                    <TextInput
                        value={jamSelesai}
                        onChangeText={(teks) => {
                            setJamSelesai(teks);
                            if (errorLokal) setErrorLokal(null);
                        }}
                        editable={!loading}
                        maxLength={5}
                        placeholder="10:00"
                        placeholderTextColor={Colors.light.textSecondary}
                        keyboardType="numbers-and-punctuation"
                        accessibilityLabel="Jam selesai"
                        style={[
                            styles.input,
                            styles.inputJam,
                            errorLokal?.field === 'waktuSelesai' && styles.inputError,
                            loading && styles.inputNonaktif,
                        ]}
                    />
                </View>

                {pesanError ? (
                    <Text
                        style={styles.error}
                        accessibilityRole="alert"
                        accessibilityLiveRegion="polite"
                    >
                        {pesanError}
                    </Text>
                ) : null}

                <View style={styles.baris}>
                    <Pressable
                        onPress={onTutup}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel="Batal"
                        accessibilityState={{ disabled: loading }}
                        style={({ pressed }) => [
                            styles.tombol,
                            styles.tombolSekunder,
                            pressed && !loading && styles.ditekan,
                            loading && styles.disabled,
                        ]}
                    >
                        <Text style={styles.tombolSekunderTeks}>Batal</Text>
                    </Pressable>
                    <Pressable
                        onPress={kirim}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel={loading ? 'Sedang menyimpan' : labelSimpan}
                        accessibilityState={{ disabled: loading, busy: loading }}
                        style={({ pressed }) => [
                            styles.tombol,
                            styles.tombolUtama,
                            pressed && !loading && styles.ditekan,
                            loading && styles.disabled,
                        ]}
                    >
                        <Text style={styles.tombolUtamaTeks}>
                            {loading ? 'Menyimpan…' : labelSimpan}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    judul: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginTop: 10,
        marginBottom: 6,
    },
    labelBaris: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 6,
    },
    labelOpsional: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
    },
    kosongkanTeks: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    barisInput: {
        flexDirection: 'row',
        gap: 10,
    },
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 15,
        color: Colors.light.text,
        backgroundColor: Colors.light.backgroundElement,
    },
    inputTanggal: {
        flex: 3,
    },
    inputJam: {
        flex: 2,
    },
    inputError: {
        borderColor: Colors.light.danger,
    },
    inputNonaktif: {
        backgroundColor: Colors.light.background,
        color: Colors.light.textSecondary,
    },
    error: {
        marginTop: 10,
        fontSize: 13,
        lineHeight: 18,
        color: Colors.light.danger,
    },
    baris: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    tombol: {
        flex: 1,
        minHeight: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    tombolSekunder: {
        backgroundColor: Colors.light.background,
    },
    tombolUtama: {
        backgroundColor: Colors.light.primary,
    },
    ditekan: {
        opacity: 0.75,
    },
    disabled: {
        opacity: 0.6,
    },
    tombolSekunderTeks: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.text,
    },
    tombolUtamaTeks: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.light.backgroundElement,
    },
});