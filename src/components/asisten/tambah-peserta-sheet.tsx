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

/** Sesuai Kontrak Data v1.1 (bagian 1.2): kode acak 8 karakter [A-Z0-9]. */
const PANJANG_KODE = 8;
const KODE_PESERTA_REGEX = /^[A-Z0-9]{8}$/;

type TambahPesertaSheetProps = {
    visible: boolean;
    /** true selama operasi simpan berjalan: input dan tombol dikunci agar tidak terkirim dua kali. */
    loading?: boolean;
    /** Pesan gagal dari service (mis. kode tidak ditemukan, peserta sudah aktif). */
    errorPesan?: string | null;
    /** Dipanggil dengan kode 8 karakter huruf kapital/angka. Pemanggil menutup sheet setelah hasil ok. */
    onSubmit: (kodePeserta: string) => void;
    onTutup: () => void;
};

export function TambahPesertaSheet({
    visible,
    loading = false,
    errorPesan = null,
    onSubmit,
    onTutup,
}: TambahPesertaSheetProps) {
    const [kode, setKode] = useState('');
    const [errorLokal, setErrorLokal] = useState<string | null>(null);
    const [fokus, setFokus] = useState(false);
    const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
    
    const [prevVisible, setPrevVisible] = useState(visible);

    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setKode('');
            setErrorLokal(null);
        }
    }

    const kodeBersih = kode.trim().toUpperCase();
    const tombolNonaktif = loading || kodeBersih.length === 0;
    const pesanError = errorLokal ?? errorPesan;

    const kirim = () => {
        if (loading) return;
        if (kodeBersih.length === 0) {
            setErrorLokal('Kode peserta wajib diisi.');
            return;
        }
        if (!KODE_PESERTA_REGEX.test(kodeBersih)) {
            setErrorLokal('Kode peserta harus 8 karakter huruf kapital atau angka.');
            return;
        }
        setErrorLokal(null);
        onSubmit(kodeBersih);
    };

    return (
        <BottomSheet
            visible={visible}
            onTutup={onTutup}
            nonaktifTutup={loading}
            denganKeyboard
            onSetelahTampil={() => inputRef.current?.focus()}
            accessibilityLabelTutup="Tutup form tambah peserta"
        >
            <Text style={styles.judul} accessibilityRole="header">
                Tambah peserta
            </Text>
            <Text style={styles.subjudul}>
                Masukkan 8 karakter kode peserta yang disalin dari profil praktikan.
            </Text>

            <Text style={styles.label}>Kode peserta</Text>
            <TextInput
                ref={inputRef}
                value={kode}
                onChangeText={(teks) => {
                    const dibersihkan = teks.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setKode(dibersihkan);
                    if (errorLokal) setErrorLokal(null);
                }}
                onFocus={() => setFokus(true)}
                onBlur={() => setFokus(false)}
                onSubmitEditing={kirim}
                editable={!loading}
                maxLength={PANJANG_KODE}
                placeholder="Contoh: A1B2C3D4"
                placeholderTextColor={Colors.light.textSecondary}
                returnKeyType="done"
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel="Kode peserta"
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
                    accessibilityLabel={loading ? 'Sedang menambahkan' : 'Tambah peserta'}
                    accessibilityState={{ disabled: tombolNonaktif, busy: loading }}
                    style={({ pressed }) => [
                        styles.tombol,
                        styles.tombolUtama,
                        pressed && !tombolNonaktif && styles.ditekan,
                        tombolNonaktif && styles.disabled,
                    ]}
                >
                    <Text style={styles.tombolUtamaTeks}>
                        {loading ? 'Menambahkan…' : 'Tambah peserta'}
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
        marginBottom: 6,
    },
    subjudul: {
        fontSize: 14,
        lineHeight: 21,
        color: Colors.light.textSecondary,
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
        fontWeight: '600',
        letterSpacing: 2,
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