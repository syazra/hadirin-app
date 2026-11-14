import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors } from '@/constants/theme';
import { ComponentRef, useRef, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

/** Batas panjang sesuai Kontrak Data v1.1 (bagian 1.5). Validasi akhir tetap di service dan Rules. */
const MAKS_NAMA = 100;

type KelasFormSheetProps = {
    visible: boolean;
    /** 'tambah' untuk kelas baru, 'ubah' untuk mengganti nama kelas yang sudah ada. */
    mode?: 'tambah' | 'ubah';
    /** Nama saat ini, dipakai pada mode 'ubah'. */
    nilaiAwal?: string;
    /** true selama operasi simpan berjalan: input dan tombol dikunci agar tidak terkirim dua kali. */
    loading?: boolean;
    /** Pesan gagal dari service (mis. jaringan, tidak berwenang). Ditampilkan di dalam form. */
    errorPesan?: string | null;
    /** Dipanggil dengan nama yang sudah di-trim. Pemanggil yang menutup sheet setelah hasil ok. */
    onSubmit: (namaPraktikum: string) => void;
    onTutup: () => void;
};

export function KelasFormSheet({
    visible,
    mode = 'tambah',
    nilaiAwal = '',
    loading = false,
    errorPesan = null,
    onSubmit,
    onTutup,
}: KelasFormSheetProps) {
    const [nama, setNama] = useState(nilaiAwal);
    const [errorLokal, setErrorLokal] = useState<string | null>(null);
    const [fokus, setFokus] = useState(false);
    const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
   
    const [prevVisible, setPrevVisible] = useState(visible);
    const [prevNilaiAwal, setPrevNilaiAwal] = useState(nilaiAwal);

    if (visible !== prevVisible || nilaiAwal !== prevNilaiAwal) {
        setPrevVisible(visible);
        setPrevNilaiAwal(nilaiAwal);
        if (visible) {
            setNama(nilaiAwal);
            setErrorLokal(null);
        }
    }

    const namaBersih = nama.trim();
    const tidakBerubah = mode === 'ubah' && namaBersih === nilaiAwal.trim();
    const tombolNonaktif = loading || tidakBerubah;
    const pesanError = errorLokal ?? errorPesan;

    const kirim = () => {
        if (loading) return;
        if (namaBersih.length === 0) {
            setErrorLokal('Nama praktikum wajib diisi.');
            return;
        }
        if (tidakBerubah) return;
        setErrorLokal(null);
        onSubmit(namaBersih);
    };

    const judul = mode === 'tambah' ? 'Tambah kelas' : 'Ubah nama kelas';
    const labelSimpan = mode === 'tambah' ? 'Simpan kelas' : 'Simpan perubahan';

    return (
        <BottomSheet
            visible={visible}
            onTutup={onTutup}
            nonaktifTutup={loading}
            denganKeyboard
            onSetelahTampil={() => inputRef.current?.focus()}
            accessibilityLabelTutup="Tutup form kelas"
        >
            <Text style={styles.judul} accessibilityRole="header">
                {judul}
            </Text>

            <Text style={styles.label}>Nama praktikum</Text>
            <TextInput
                ref={inputRef}
                value={nama}
                onChangeText={(teks) => {
                    setNama(teks);
                    if (errorLokal) setErrorLokal(null);
                }}
                onFocus={() => setFokus(true)}
                onBlur={() => setFokus(false)}
                onSubmitEditing={kirim}
                editable={!loading}
                maxLength={MAKS_NAMA}
                placeholder="Contoh: Pemrograman Perangkat Bergerak"
                placeholderTextColor={Colors.light.textSecondary}
                returnKeyType="done"
                autoCapitalize="words"
                accessibilityLabel="Nama praktikum"
                style={[
                    styles.input,
                    fokus && styles.inputFokus,
                    pesanError ? styles.inputError : null,
                    loading && styles.inputNonaktif,
                ]}
            />

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
                    disabled={tombolNonaktif}
                    accessibilityRole="button"
                    accessibilityLabel={loading ? 'Sedang menyimpan' : labelSimpan}
                    accessibilityState={{ disabled: tombolNonaktif, busy: loading }}
                    style={({ pressed }) => [
                        styles.tombol,
                        styles.tombolUtama,
                        pressed && !tombolNonaktif && styles.ditekan,
                        tombolNonaktif && styles.disabled,
                    ]}
                >
                    <Text style={styles.tombolUtamaTeks}>
                        {loading ? 'Menyimpan…' : labelSimpan}
                    </Text>
                </Pressable>
            </View>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    judul: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 6,
    },
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 16,
        color: Colors.light.text,
        backgroundColor: Colors.light.backgroundElement,
    },
    inputFokus: {
        borderColor: Colors.light.primary,
    },
    inputError: {
        borderColor: Colors.light.danger,
    },
    inputNonaktif: {
        backgroundColor: Colors.light.background,
        color: Colors.light.textSecondary,
    },
    error: {
        marginTop: 8,
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