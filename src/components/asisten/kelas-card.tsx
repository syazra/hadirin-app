import { Colors } from '@/constants/theme';
import type { Kelas } from '@/types';
import { formatWaktu } from '@/utils/format-waktu';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type KelasCardProps = {
    kelas: Kelas;
    onPress: () => void;
    onEdit?: () => void;
    onArsip?: () => void;
    subjudul?: string;
    jumlahPeserta?: number;
    infoSesi?: string;
};

const KATA_PENGHUBUNG = new Set(['dan', 'di', 'ke', 'dari', 'untuk', 'yang']);

function buatInisialKelas(nama: string): string {
    const kata = nama
        .trim()
        .split(/\s+/)
        .map((bagian) => bagian.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
        .filter(
            (bagian) =>
                bagian.length > 0 &&
                !KATA_PENGHUBUNG.has(bagian.toLowerCase()),
        );

    if (kata.length === 0) return '?';
    if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase();

    return kata
        .slice(0, 2)
        .map((bagian) => bagian[0])
        .join('')
        .toUpperCase();
}

function IkonJam({ color }: { color: string }) {
    return (
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Circle
                cx={12}
                cy={12}
                r={9}
                stroke={color}
                strokeWidth={1.9}
            />
            <Path
                d="M12 7v5l3 2"
                stroke={color}
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function IkonPeserta({ color }: { color: string }) {
    return (
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Circle
                cx={9}
                cy={7}
                r={3.5}
                stroke={color}
                strokeWidth={1.9}
            />
            <Path
                d="M2.5 20a6.5 6.5 0 0 1 13 0"
                stroke={color}
                strokeWidth={1.9}
                strokeLinecap="round"
            />
            <Path
                d="M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5a5.5 5.5 0 0 1 3.5 5.5"
                stroke={color}
                strokeWidth={1.9}
                strokeLinecap="round"
            />
        </Svg>
    );
}

function IkonSentuh({ color }: { color: string }) {
    return (
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path
                d="M9 11.5V5.5a1.5 1.5 0 0 1 3 0v5m0-3a1.5 1.5 0 0 1 3 0v3m0-1.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-1.5a5.5 5.5 0 0 1-4.4-2.2l-2.3-3a1.5 1.5 0 0 1 2.3-1.9L9 14.5v-3Z"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function IkonPanah({ color }: { color: string }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
                d="m9 18 6-6-6-6"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function IkonPensil({ color }: { color: string }) {
    return (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
                d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                stroke={color}
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function IkonArsip({ color }: { color: string }) {
    return (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Rect
                x={3}
                y={4}
                width={18}
                height={4}
                rx={1}
                stroke={color}
                strokeWidth={1.9}
            />
            <Path
                d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4"
                stroke={color}
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

const PALET_IKON = [
    { bg: '#EBF2FF', teks: '#1D4ED8' }, // Biru
    { bg: '#ECFDF5', teks: '#047857' }, // Hijau
    { bg: '#FEF3C7', teks: '#B45309' }, // Kuning / Amber
    { bg: '#F3E8FF', teks: '#7E22CE' }, // Ungu
    { bg: '#E0F2FE', teks: '#0369A1' }, // Biru muda
    { bg: '#FFEDD5', teks: '#C2410C' }, // Oranye
] as const;

function pilihWarnaIkon(kunci: string) {
    let hash = 0;
    for (let i = 0; i < kunci.length; i += 1) {
        hash = (hash * 31 + kunci.charCodeAt(i)) % PALET_IKON.length;
    }
    return PALET_IKON[Math.abs(hash) % PALET_IKON.length];
}

export function KelasCard({
    kelas,
    onPress,
    onEdit,
    onArsip,
    subjudul,
    jumlahPeserta,
    infoSesi,
}: KelasCardProps) {
    const diarsipkan = kelas.diarsipkan;
    const inisial = buatInisialKelas(kelas.namaPraktikum);
    const warnaIkon = pilihWarnaIkon(kelas.idKelas || kelas.namaPraktikum);

    const ringkasanParts: string[] = [];
    if (jumlahPeserta !== undefined) {
        ringkasanParts.push(`${jumlahPeserta} Praktikan`);
    }
    if (infoSesi) {
        ringkasanParts.push(infoSesi);
    }

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Buka detail kelas ${kelas.namaPraktikum}`}
            style={({ pressed }) => [
                styles.kartu,
                diarsipkan && styles.kartuDiarsipkan,
                pressed && styles.ditekan,
            ]}
        >
            <View style={styles.barisAtas}>
                <View
                    style={[
                        styles.ikonKotak,
                        { backgroundColor: warnaIkon.bg },
                    ]}
                >
                    <Text
                        style={[
                            styles.ikonInisial,
                            { color: warnaIkon.teks },
                        ]}
                    >
                        {inisial}
                    </Text>
                </View>

                <View style={styles.judulWrap}>
                    <Text style={styles.nama} numberOfLines={2}>
                        {kelas.namaPraktikum}
                    </Text>
                    {subjudul ? (
                        <Text style={styles.subjudul} numberOfLines={1}>
                            {subjudul}
                        </Text>
                    ) : null}
                </View>

                <View
                    style={[
                        styles.badge,
                        diarsipkan ? styles.badgeArsip : styles.badgeAktif,
                    ]}
                >
                    <Text
                        style={[
                            styles.badgeTeks,
                            diarsipkan
                                ? styles.badgeTeksArsip
                                : styles.badgeTeksAktif,
                        ]}
                    >
                        {diarsipkan ? 'Diarsipkan' : 'Aktif'}
                    </Text>
                </View>
            </View>

            <View style={styles.metaGroup}>
                <View style={styles.metaBaris}>
                    <IkonJam color={Colors.light.textSecondary} />
                    <Text style={styles.meta}>
                        Dibuat:{' '}
                        {kelas.dibuatPada
                            ? formatWaktu(kelas.dibuatPada.toISOString())
                            : 'Memproses…'}
                    </Text>
                </View>

                {ringkasanParts.length > 0 ? (
                    <View style={styles.metaBaris}>
                        <IkonPeserta color={Colors.light.textSecondary} />
                        <Text style={styles.meta}>
                            {ringkasanParts.join(' • ')}
                        </Text>
                    </View>
                ) : null}
            </View>

            <View style={styles.footer}>
                <View style={styles.barisPetunjuk}>
                    <View style={styles.petunjukKiri}>
                        <IkonSentuh color={Colors.light.textSecondary} />
                        <Text style={styles.petunjuk}>
                            Kelola peserta & sesi presensi
                        </Text>
                    </View>
                    <IkonPanah color={Colors.light.textSecondary} />
                </View>

                {!diarsipkan && (onEdit || onArsip) ? (
                    <View style={styles.grupTombol}>
                        {onEdit ? (
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel={`Ubah kelas ${kelas.namaPraktikum}`}
                                style={({ pressed }) => [
                                    styles.tombolAksi,
                                    styles.tombolEdit,
                                    pressed && styles.ditekan,
                                ]}
                            >
                                <IkonPensil color={Colors.light.text} />
                                <Text style={styles.tombolEditTeks}>Ubah</Text>
                            </Pressable>
                        ) : null}

                        {onArsip ? (
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onArsip();
                                }}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel={`Arsipkan kelas ${kelas.namaPraktikum}`}
                                style={({ pressed }) => [
                                    styles.tombolAksi,
                                    styles.tombolArsip,
                                    pressed && styles.ditekan,
                                ]}
                            >
                                <IkonArsip color={Colors.light.danger} />
                                <Text style={styles.tombolArsipTeks}>
                                    Arsipkan
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    kartu: {
        backgroundColor: Colors.light.backgroundElement,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 16,
        padding: 16,
        gap: 12,
    },
    kartuDiarsipkan: {
        opacity: 0.75,
        backgroundColor: Colors.light.background,
    },
    ditekan: {
        opacity: 0.75,
    },
    barisAtas: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    ikonKotak: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: '#EBF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ikonInisial: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.primary,
        letterSpacing: 0.5,
    },
    judulWrap: {
        flex: 1,
        gap: 2,
    },
    nama: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 22,
        color: Colors.light.text,
    },
    subjudul: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    badgeAktif: {
        backgroundColor: Colors.light.successSoft,
    },
    badgeArsip: {
        backgroundColor: Colors.light.border,
    },
    badgeTeks: {
        fontSize: 12,
        fontWeight: '600',
    },
    badgeTeksAktif: {
        color: Colors.light.success,
    },
    badgeTeksArsip: {
        color: Colors.light.textSecondary,
    },
    metaGroup: {
        gap: 6,
    },
    metaBaris: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    meta: {
        fontSize: 13,
        color: Colors.light.textSecondary,
    },
    footer: {
        gap: 10,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    barisPetunjuk: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    petunjukKiri: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    petunjuk: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    grupTombol: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },
    tombolAksi: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
    },
    tombolEdit: {
        backgroundColor: '#EEF3FA',
    },
    tombolEditTeks: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.text,
    },
    tombolArsip: {
        backgroundColor: '#FEE2E2',
    },
    tombolArsipTeks: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.danger,
    },
});