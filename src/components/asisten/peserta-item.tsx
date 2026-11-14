import { Colors } from '@/constants/theme';
import type { Keanggotaan } from '@/types';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type PesertaItemProps = {
    peserta: Keanggotaan;
    /** true jika kelas sudah diarsipkan sehingga status peserta tidak dapat diubah. */
    kelasDiarsipkan?: boolean;
    loading?: boolean;
    onNonaktifkan?: () => void;
    onAktifkan?: () => void;
};

export function PesertaItem({
    peserta,
    kelasDiarsipkan = false,
    loading = false,
    onNonaktifkan,
    onAktifkan,
}: PesertaItemProps) {
    const aktif = peserta.status === 'AKTIF';

    return (
        <View style={[styles.kartu, !aktif && styles.kartuNonaktif]}>
            <View style={styles.info}>
                <View style={styles.barisNama}>
                    <Text style={styles.nama} numberOfLines={1}>
                        {peserta.nama}
                    </Text>

                    <View
                        style={[
                            styles.badge,
                            aktif ? styles.badgeAktif : styles.badgeNonaktif,
                        ]}
                    >
                        <Text
                            style={[
                                styles.badgeTeks,
                                aktif
                                    ? styles.badgeTeksAktif
                                    : styles.badgeTeksNonaktif,
                            ]}
                        >
                            {aktif ? 'Aktif' : 'Nonaktif'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.nim}>NIM: {peserta.nim}</Text>
            </View>

            {!kelasDiarsipkan ? (
                aktif && onNonaktifkan ? (
                    <Pressable
                        onPress={onNonaktifkan}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel={`Nonaktifkan ${peserta.nama}`}
                        accessibilityState={{ disabled: loading }}
                        style={({ pressed }) => [
                            styles.tombol,
                            styles.tombolBahaya,
                            pressed && !loading && styles.ditekan,
                            loading && styles.disabled,
                        ]}
                    >
                        <Text style={styles.tombolBahayaTeks}>Nonaktifkan</Text>
                    </Pressable>
                ) : !aktif && onAktifkan ? (
                    <Pressable
                        onPress={onAktifkan}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel={`Aktifkan kembali ${peserta.nama}`}
                        accessibilityState={{ disabled: loading }}
                        style={({ pressed }) => [
                            styles.tombol,
                            styles.tombolSekunder,
                            pressed && !loading && styles.ditekan,
                            loading && styles.disabled,
                        ]}
                    >
                        <Text style={styles.tombolSekunderTeks}>Aktifkan</Text>
                    </Pressable>
                ) : null
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    kartu: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundElement,
    },
    kartuNonaktif: {
        opacity: 0.72,
        backgroundColor: Colors.light.background,
    },
    info: {
        flex: 1,
        gap: 4,
    },
    barisNama: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    nama: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.text,
    },
    nim: {
        fontSize: 13,
        color: Colors.light.textSecondary,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    badgeAktif: {
        backgroundColor: '#E6F4FE',
    },
    badgeNonaktif: {
        backgroundColor: Colors.light.border,
    },
    badgeTeks: {
        fontSize: 11,
        fontWeight: '600',
    },
    badgeTeksAktif: {
        color: Colors.light.primary,
    },
    badgeTeksNonaktif: {
        color: Colors.light.textSecondary,
    },
    tombol: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    tombolSekunder: {
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    tombolSekunderTeks: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.text,
    },
    tombolBahaya: {
        backgroundColor: '#FEE2E2',
    },
    tombolBahayaTeks: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.danger,
    },
    ditekan: {
        opacity: 0.75,
    },
    disabled: {
        opacity: 0.55,
    },
});