import { KelasFormSheet } from '@/components/asisten/kelas-form-sheet';
import {
    SesiFormSheet,
    type NilaiFormSesi,
} from '@/components/asisten/sesi-form-sheet';
import { TambahPesertaSheet } from '@/components/asisten/tambah-peserta-sheet';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useKelasAsisten } from '@/hooks/use-kelas-asisten';
import { usePesertaKelas } from '@/hooks/use-peserta-kelas';
import { arsipkanKelas, ubahKelas } from '@/services/kelas-service';
import {
    nonaktifkanPeserta,
    tambahPesertaByKode,
} from '@/services/peserta-service';
import {
    arsipkanSesi,
    buatSesi,
    listenSesiKelas,
    ubahSesi,
} from '@/services/sesi-service';
import type { Keanggotaan, Sesi } from '@/types';
import { formatWaktu } from '@/utils/format-waktu';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterKelas = 'sesi' | 'praktikan';

type FilterKelasBarProps = {
    aktif: FilterKelas;
    jumlahSesi: number;
    jumlahPraktikan: number;
    onGanti: (filter: FilterKelas) => void;
    /** Dipanggil saat tombol + ditekan. Tombol disembunyikan jika tidak diberikan (mis. kelas diarsipkan). */
    onTambah?: () => void;
};

const OPSI: { kunci: FilterKelas; label: string }[] = [
    { kunci: 'sesi', label: 'Sesi' },
    { kunci: 'praktikan', label: 'Praktikan' },
];

function FilterKelasBar({
    aktif,
    jumlahSesi,
    jumlahPraktikan,
    onGanti,
    onTambah,
}: FilterKelasBarProps) {
    const jumlah: Record<FilterKelas, number> = {
        sesi: jumlahSesi,
        praktikan: jumlahPraktikan,
    };

    return (
        <View style={stylesFilter.baris}>
            <View style={stylesFilter.segmen} accessibilityRole="tablist">
                {OPSI.map((opsi) => {
                    const dipilih = aktif === opsi.kunci;
                    return (
                        <Pressable
                            key={opsi.kunci}
                            onPress={() => onGanti(opsi.kunci)}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: dipilih }}
                            accessibilityLabel={`${opsi.label}, ${jumlah[opsi.kunci]} item`}
                            style={({ pressed }) => [
                                stylesFilter.opsi,
                                dipilih && stylesFilter.opsiAktif,
                                pressed && !dipilih && stylesFilter.ditekan,
                            ]}
                        >
                            <Text
                                style={[
                                    stylesFilter.opsiTeks,
                                    dipilih && stylesFilter.opsiTeksAktif,
                                ]}
                            >
                                {opsi.label}
                            </Text>
                            <View
                                style={[
                                    stylesFilter.hitung,
                                    dipilih && stylesFilter.hitungAktif,
                                ]}
                            >
                                <Text
                                    style={[
                                        stylesFilter.hitungTeks,
                                        dipilih && stylesFilter.hitungTeksAktif,
                                    ]}
                                >
                                    {jumlah[opsi.kunci]}
                                </Text>
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            {onTambah ? (
                <Pressable
                    onPress={onTambah}
                    accessibilityRole="button"
                    accessibilityLabel={
                        aktif === 'sesi' ? 'Tambah sesi' : 'Tambah praktikan'
                    }
                    hitSlop={6}
                    style={({ pressed }) => [
                        stylesFilter.tombolTambah,
                        pressed && stylesFilter.ditekan,
                    ]}
                >
                    <Text style={stylesFilter.tombolTambahTeks}>+</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

const stylesFilter = StyleSheet.create({
    baris: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    segmen: {
        flex: 1,
        flexDirection: 'row',
        padding: 4,
        gap: 4,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundElement,
    },
    opsi: {
        flex: 1,
        minHeight: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 9,
    },
    opsiAktif: {
        backgroundColor: Colors.light.primary,
    },
    opsiTeks: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textSecondary,
    },
    opsiTeksAktif: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    hitung: {
        minWidth: 22,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
        alignItems: 'center',
        backgroundColor: Colors.light.border,
    },
    hitungAktif: {
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
    hitungTeks: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.light.textSecondary,
    },
    hitungTeksAktif: {
        color: '#FFFFFF',
    },
    tombolTambah: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.primary,
        shadowColor: Colors.light.primary,
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    tombolTambahTeks: {
        fontSize: 28,
        lineHeight: 30,
        fontWeight: '400',
        color: Colors.light.backgroundElement,
    },
    ditekan: {
        opacity: 0.75,
    },
});

const BULAN_SINGKAT = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
];

const KATA_PENGHUBUNG = new Set(['dan', 'di', 'ke', 'dari', 'untuk', 'yang']);

function buatInisial(nama: string): string {
    const kata = nama
        .trim()
        .split(/\s+/)
        .map((bagian) => bagian.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
        .filter(
            (bagian) =>
                bagian.length > 0 && !KATA_PENGHUBUNG.has(bagian.toLowerCase()),
        );

    if (kata.length === 0) return '?';
    if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase();
    return kata
        .slice(0, 2)
        .map((bagian) => bagian[0])
        .join('')
        .toUpperCase();
}

export default function DetailKelasScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const kelasId = typeof id === 'string' ? id : '';

    const { pengguna } = useAuth();
    const {
        kelas,
        loading: loadingKelas,
        error: errorKelas,
        cobaLagi: cobaLagiKelas,
    } = useKelasAsisten(pengguna?.uid ?? null, {
        sertakanArsip: true,
        hitungPeserta: false,
    });

    const {
        peserta,
        loading: loadingPeserta,
        error: errorPeserta,
        cobaLagi: cobaLagiPeserta,
    } = usePesertaKelas(kelasId || null);

    const kelasAktif = kelas.find((item) => item.idKelas === kelasId) ?? null;

    const [stateSesi, setStateSesi] = useState<{
        kelasId: string;
        retryKey: number;
        sesi: Sesi[];
        loading: boolean;
        error: string | null;
    } | null>(null);
    const [retrySesiKey, setRetrySesiKey] = useState(0);

    const cobaLagiSesi = useCallback(() => {
        setRetrySesiKey((prev) => prev + 1);
    }, []);

    useEffect(() => {
        if (!kelasId) {
            return;
        }

        const idKelasAktif = kelasId;
        const retryAktif = retrySesiKey;
        let aktif = true;

        const unsubscribe = listenSesiKelas(
            idKelasAktif,
            (daftarSesi) => {
                if (!aktif) return;
                setStateSesi({
                    kelasId: idKelasAktif,
                    retryKey: retryAktif,
                    sesi: daftarSesi,
                    loading: false,
                    error: null,
                });
            },
            (error) => {
                if (!aktif) return;
                setStateSesi({
                    kelasId: idKelasAktif,
                    retryKey: retryAktif,
                    sesi: [],
                    loading: false,
                    error:
                        error.message.trim().length > 0
                            ? error.message
                            : 'Gagal memuat daftar sesi kelas.',
                });
            },
            true,
        );

        return () => {
            aktif = false;
            unsubscribe();
        };
    }, [kelasId, retrySesiKey]);

    const stateSesiAktif =
        kelasId &&
        stateSesi?.kelasId === kelasId &&
        stateSesi.retryKey === retrySesiKey
            ? stateSesi
            : null;
    const sesiKelas = stateSesiAktif?.sesi ?? [];
    const loadingSesi = kelasId ? (stateSesiAktif?.loading ?? true) : false;
    const errorSesi = stateSesiAktif?.error ?? null;

    const [filter, setFilter] = useState<FilterKelas>('sesi');

    const [editTerbuka, setEditTerbuka] = useState(false);
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [errorEdit, setErrorEdit] = useState<string | null>(null);

    const [arsipTerbuka, setArsipTerbuka] = useState(false);
    const [loadingArsip, setLoadingArsip] = useState(false);

    const [tambahPesertaTerbuka, setTambahPesertaTerbuka] = useState(false);
    const [loadingTambahPeserta, setLoadingTambahPeserta] = useState(false);
    const [errorTambahPeserta, setErrorTambahPeserta] = useState<string | null>(
        null,
    );

    const [pesertaDinonaktifkan, setPesertaDinonaktifkan] =
        useState<Keanggotaan | null>(null);
    const [loadingStatusPeserta, setLoadingStatusPeserta] = useState(false);

    const [formSesiTerbuka, setFormSesiTerbuka] = useState(false);
    const [modeFormSesi, setModeFormSesi] = useState<'tambah' | 'ubah'>(
        'tambah',
    );
    const [sesiDiedit, setSesiDiedit] = useState<Sesi | null>(null);
    const [loadingSimpanSesi, setLoadingSimpanSesi] = useState(false);
    const [errorFormSesi, setErrorFormSesi] = useState<string | null>(null);

    const [sesiDiarsipkan, setSesiDiarsipkan] = useState<Sesi | null>(null);
    const [loadingArsipSesi, setLoadingArsipSesi] = useState(false);

    const handleUbahKelas = async (namaPraktikum: string) => {
        if (!kelasAktif || kelasAktif.diarsipkan) return;
        setLoadingEdit(true);
        setErrorEdit(null);

        const hasil = await ubahKelas(kelasAktif.idKelas, { namaPraktikum });
        setLoadingEdit(false);

        if (!hasil.ok) {
            setErrorEdit(hasil.pesan);
            return;
        }

        setEditTerbuka(false);
    };

    const handleArsipkanKelas = async () => {
        if (!kelasAktif || kelasAktif.diarsipkan || loadingArsip) return;
        setLoadingArsip(true);

        const hasil = await arsipkanKelas(kelasAktif.idKelas);
        setLoadingArsip(false);

        if (!hasil.ok) {
            Alert.alert('Gagal mengarsipkan kelas', hasil.pesan);
            return;
        }

        setArsipTerbuka(false);
    };

    const handleTambahPeserta = async (kodePeserta: string) => {
        if (!kelasAktif || kelasAktif.diarsipkan) return;
        setLoadingTambahPeserta(true);
        setErrorTambahPeserta(null);

        const hasil = await tambahPesertaByKode(
            kelasAktif.idKelas,
            kodePeserta,
        );
        setLoadingTambahPeserta(false);

        if (!hasil.ok) {
            setErrorTambahPeserta(hasil.pesan);
            return;
        }

        setTambahPesertaTerbuka(false);
    };

    const handleKonfirmasiNonaktif = async () => {
        if (
            !kelasAktif ||
            kelasAktif.diarsipkan ||
            !pesertaDinonaktifkan ||
            loadingStatusPeserta
        ) {
            return;
        }
        setLoadingStatusPeserta(true);

        const hasil = await nonaktifkanPeserta(
            pesertaDinonaktifkan.idKeanggotaan,
        );
        setLoadingStatusPeserta(false);

        if (!hasil.ok) {
            Alert.alert('Gagal menonaktifkan peserta', hasil.pesan);
            return;
        }

        setPesertaDinonaktifkan(null);
    };

    const handleSimpanSesi = async (nilai: NilaiFormSesi) => {
        if (!kelasAktif || kelasAktif.diarsipkan || loadingSimpanSesi) return;
        setLoadingSimpanSesi(true);
        setErrorFormSesi(null);

        const hasil =
            modeFormSesi === 'tambah'
                ? await buatSesi({
                      kelasId: kelasAktif.idKelas,
                      judul: nilai.judul,
                      lokasi: nilai.lokasi,
                      waktuMulai: nilai.waktuMulai,
                      waktuSelesai: nilai.waktuSelesai,
                  })
                : sesiDiedit
                  ? await ubahSesi(sesiDiedit.idSesi, {
                        judul: nilai.judul,
                        lokasi: nilai.lokasi,
                        waktuMulai: nilai.waktuMulai,
                        waktuSelesai: nilai.waktuSelesai,
                    })
                  : null;

        setLoadingSimpanSesi(false);

        if (!hasil) {
            setErrorFormSesi('Sesi yang akan diubah tidak ditemukan.');
            return;
        }

        if (!hasil.ok) {
            setErrorFormSesi(hasil.pesan);
            return;
        }

        setFormSesiTerbuka(false);
        setSesiDiedit(null);
    };

    const handleKonfirmasiArsipSesi = async () => {
        if (
            !kelasAktif ||
            kelasAktif.diarsipkan ||
            !sesiDiarsipkan ||
            loadingArsipSesi
        ) {
            return;
        }
        setLoadingArsipSesi(true);

        const hasil = await arsipkanSesi(sesiDiarsipkan.idSesi);
        setLoadingArsipSesi(false);

        if (!hasil.ok) {
            Alert.alert('Gagal mengarsipkan sesi', hasil.pesan);
            return;
        }

        setSesiDiarsipkan(null);
    };

    const handleTekanTambah = () => {
        if (!kelasAktif || kelasAktif.diarsipkan) return;
        if (filter === 'sesi') {
            setModeFormSesi('tambah');
            setSesiDiedit(null);
            setErrorFormSesi(null);
            setFormSesiTerbuka(true);
        } else {
            setErrorTambahPeserta(null);
            setTambahPesertaTerbuka(true);
        }
    };

    if (loadingKelas) {
        return (
            <>
                <Stack.Screen options={{ title: 'Detail Kelas' }} />
                <LoadingState pesan="Memuat detail kelas…" />
            </>
        );
    }

    if (errorKelas) {
        return (
            <>
                <Stack.Screen options={{ title: 'Detail Kelas' }} />
                <ErrorState pesan={errorKelas} onCobaLagi={cobaLagiKelas} />
            </>
        );
    }

    if (!kelasAktif) {
        return (
            <>
                <Stack.Screen options={{ title: 'Detail Kelas' }} />
                <View style={styles.container}>
                    <EmptyState
                        judul="Kelas tidak ditemukan"
                        pesan="Kelas tidak tersedia atau Anda tidak memiliki akses ke kelas ini."
                    />
                </View>
            </>
        );
    }

    const jumlahPesertaAktif = peserta.filter((p) => p.status === 'AKTIF').length;
    const daftarPesertaUrut = [...peserta].sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === 'AKTIF' ? -1 : 1;
    });

    const jumlahSesiAktif = sesiKelas.filter((s) => !s.diarsipkan).length;
    const daftarSesiUrut = [...sesiKelas].sort((a, b) => {
        if (a.diarsipkan === b.diarsipkan) return 0;
        return a.diarsipkan ? 1 : -1;
    });

    return (
        <>
            <Stack.Screen
                options={{ title: kelasAktif.namaPraktikum || 'Detail Kelas' }}
            />
            <View style={styles.container}>
                {/* Bagian atas: tetap diam, tidak ikut tergulir */}
                <View style={styles.headerTetap}>
                    <View
                        style={[
                            styles.hero,
                            kelasAktif.diarsipkan && styles.heroDiarsipkan,
                        ]}
                    >
                        <View style={styles.heroBarisAtas}>
                            <View style={styles.heroIkon}>
                                <Text style={styles.heroIkonTeks}>
                                    {buatInisial(kelasAktif.namaPraktikum)}
                                </Text>
                            </View>

                            <View style={styles.heroJudulWrap}>
                                <Text
                                    style={styles.heroJudul}
                                    numberOfLines={2}
                                >
                                    {kelasAktif.namaPraktikum}
                                </Text>
                                <Text style={styles.heroSub} numberOfLines={1}>
                                    Dibuat:{' '}
                                    {kelasAktif.dibuatPada
                                        ? formatWaktu(
                                              kelasAktif.dibuatPada.toISOString(),
                                          )
                                        : 'Memproses…'}
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.heroBadge,
                                    kelasAktif.diarsipkan &&
                                        styles.heroBadgeArsip,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.heroBadgeTeks,
                                        kelasAktif.diarsipkan &&
                                            styles.heroBadgeTeksArsip,
                                    ]}
                                >
                                    {kelasAktif.diarsipkan
                                        ? 'Diarsipkan'
                                        : 'Aktif'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.heroBarisBawah}>
                            <View style={styles.heroChip}>
                                <Text style={styles.heroChipAngka}>
                                    {jumlahPesertaAktif}
                                </Text>
                                <Text style={styles.heroChipLabel}>
                                    Praktikan
                                </Text>
                            </View>
                            <View style={styles.heroChip}>
                                <Text style={styles.heroChipAngka}>
                                    {jumlahSesiAktif}
                                </Text>
                                <Text style={styles.heroChipLabel}>Sesi</Text>
                            </View>

                            <View style={styles.spacer} />

                            {!kelasAktif.diarsipkan ? (
                                <>
                                    <Pressable
                                        onPress={() => {
                                            setErrorEdit(null);
                                            setEditTerbuka(true);
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel="Ubah nama kelas"
                                        style={({ pressed }) => [
                                            styles.heroTombol,
                                            pressed && styles.ditekan,
                                        ]}
                                    >
                                        <Text style={styles.heroTombolTeks}>
                                            Ubah
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={() => setArsipTerbuka(true)}
                                        accessibilityRole="button"
                                        accessibilityLabel="Arsipkan kelas"
                                        style={({ pressed }) => [
                                            styles.heroTombol,
                                            styles.heroTombolBahaya,
                                            pressed && styles.ditekan,
                                        ]}
                                    >
                                        <Text
                                            style={styles.heroTombolBahayaTeks}
                                        >
                                            Arsipkan
                                        </Text>
                                    </Pressable>
                                </>
                            ) : null}
                        </View>
                    </View>

                    <FilterKelasBar
                        aktif={filter}
                        jumlahSesi={jumlahSesiAktif}
                        jumlahPraktikan={jumlahPesertaAktif}
                        onGanti={setFilter}
                        onTambah={
                            kelasAktif.diarsipkan
                                ? undefined
                                : handleTekanTambah
                        }
                    />
                </View>

                {/* Hanya bagian ini yang tergulir */}
                <ScrollView
                    style={styles.daftarScroll}
                    contentContainerStyle={[
                        styles.content,
                        { paddingBottom: 20 + insets.bottom },
                    ]}
                >
                    {filter === 'sesi' ? (
                        <>
                            {loadingSesi ? (
                                <View style={styles.stateBox}>
                                    <LoadingState
                                        pesan="Memuat sesi praktikum…"
                                        layarPenuh={false}
                                    />
                                </View>
                            ) : errorSesi ? (
                                <View style={styles.stateBox}>
                                    <ErrorState
                                        pesan={errorSesi}
                                        onCobaLagi={cobaLagiSesi}
                                        layarPenuh={false}
                                    />
                                </View>
                            ) : daftarSesiUrut.length === 0 ? (
                                <EmptyState
                                    judul="Belum ada sesi"
                                    pesan={
                                        kelasAktif.diarsipkan
                                            ? 'Tidak ada sesi yang tersimpan pada kelas arsip ini.'
                                            : 'Tambahkan sesi praktikum untuk mulai mengelola jadwal dan presensi.'
                                    }
                                />
                            ) : (
                                <View style={styles.daftarPeserta}>
                                    {daftarSesiUrut.map((item) => {
                                        const sesiTerkunci =
                                            kelasAktif.diarsipkan ||
                                            item.diarsipkan;

                                        return (
                                            <Pressable
                                                key={item.idSesi}
                                                onPress={() =>
                                                    router.push({
                                                        pathname: '/sesi/[id]',
                                                        params: {
                                                            id: item.idSesi,
                                                        },
                                                    })
                                                }
                                                accessibilityRole="button"
                                                accessibilityLabel={`Buka detail sesi ${item.judul}`}
                                                // Kurangi sensitivitas saat menggulir: jari yang
                                                // bergeser keluar kartu membatalkan tap, dan efek
                                                // tekan baru muncul setelah jeda singkat.
                                                pressRetentionOffset={0}
                                                unstable_pressDelay={100}
                                                style={({ pressed }) => [
                                                    styles.kartuSesi,
                                                    item.diarsipkan &&
                                                        styles.kartuRedup,
                                                    pressed && styles.ditekan,
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        styles.sesiAksen,
                                                        !item.diarsipkan &&
                                                            item.statusSesi ===
                                                                'DIBUKA' &&
                                                            styles.sesiAksenAktif,
                                                    ]}
                                                />
                                                <View style={styles.sesiIsi}>
                                                    <View
                                                        style={
                                                            styles.sesiBarisUtama
                                                        }
                                                    >
                                                        <View
                                                            style={[
                                                                styles.sesiTanggal,
                                                                !item.diarsipkan &&
                                                                    item.statusSesi ===
                                                                        'DIBUKA' &&
                                                                    styles.sesiTanggalAktif,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.sesiTanggalAngka,
                                                                    !item.diarsipkan &&
                                                                        item.statusSesi ===
                                                                            'DIBUKA' &&
                                                                        styles.sesiTanggalAngkaAktif,
                                                                ]}
                                                            >
                                                                {item.waktuMulai.getDate()}
                                                            </Text>
                                                            <Text
                                                                style={
                                                                    styles.sesiTanggalBulan
                                                                }
                                                            >
                                                                {
                                                                    BULAN_SINGKAT[
                                                                        item.waktuMulai.getMonth()
                                                                    ]
                                                                }
                                                            </Text>
                                                        </View>

                                                        <View
                                                            style={
                                                                styles.sesiInfo
                                                            }
                                                        >
                                                            <View
                                                                style={
                                                                    styles.barisAtas
                                                                }
                                                            >
                                                                <Text
                                                                    style={
                                                                        styles.namaPeserta
                                                                    }
                                                                    numberOfLines={
                                                                        2
                                                                    }
                                                                >
                                                                    {item.judul}
                                                                </Text>
                                                                {item.diarsipkan ? (
                                                                    <View
                                                                        style={
                                                                            styles.badgeRedup
                                                                        }
                                                                    >
                                                                        <Text
                                                                            style={
                                                                                styles.badgeRedupTeks
                                                                            }
                                                                        >
                                                                            Diarsipkan
                                                                        </Text>
                                                                    </View>
                                                                ) : (
                                                                    <StatusBadge
                                                                        status={
                                                                            item.statusSesi
                                                                        }
                                                                    />
                                                                )}
                                                            </View>
                                                            <Text
                                                                style={
                                                                    styles.meta
                                                                }
                                                            >
                                                                Lokasi:{' '}
                                                                {item.lokasi}
                                                            </Text>
                                                            <Text
                                                                style={
                                                                    styles.meta
                                                                }
                                                            >
                                                                Mulai:{' '}
                                                                {formatWaktu(
                                                                    item.waktuMulai.toISOString(),
                                                                )}
                                                                {item.waktuSelesai
                                                                    ? ` · Selesai: ${formatWaktu(item.waktuSelesai.toISOString())}`
                                                                    : ''}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    <View
                                                        style={
                                                            styles.barisTombolSesi
                                                        }
                                                    >
                                                        {!sesiTerkunci ? (
                                                            <Pressable
                                                                onPress={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setModeFormSesi(
                                                                        'ubah',
                                                                    );
                                                                    setSesiDiedit(
                                                                        item,
                                                                    );
                                                                    setErrorFormSesi(
                                                                        null,
                                                                    );
                                                                    setFormSesiTerbuka(
                                                                        true,
                                                                    );
                                                                }}
                                                                accessibilityRole="button"
                                                                style={({
                                                                    pressed,
                                                                }) => [
                                                                    styles.tombolSekunder,
                                                                    pressed &&
                                                                        styles.ditekan,
                                                                ]}
                                                            >
                                                                <Text
                                                                    style={
                                                                        styles.tombolSekunderTeks
                                                                    }
                                                                >
                                                                    Ubah
                                                                </Text>
                                                            </Pressable>
                                                        ) : null}

                                                        {!sesiTerkunci &&
                                                        item.statusSesi !==
                                                            'DIBUKA' ? (
                                                            <Pressable
                                                                onPress={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setSesiDiarsipkan(
                                                                        item,
                                                                    );
                                                                }}
                                                                accessibilityRole="button"
                                                                style={({
                                                                    pressed,
                                                                }) => [
                                                                    styles.tombolBahaya,
                                                                    pressed &&
                                                                        styles.ditekan,
                                                                ]}
                                                            >
                                                                <Text
                                                                    style={
                                                                        styles.tombolBahayaTeks
                                                                    }
                                                                >
                                                                    Arsipkan
                                                                </Text>
                                                            </Pressable>
                                                        ) : null}

                                                        <View
                                                            style={
                                                                styles.spacer
                                                            }
                                                        />
                                                        <Text
                                                            style={
                                                                styles.lihatDetailTeks
                                                            }
                                                        >
                                                            Detail sesi ›
                                                        </Text>
                                                    </View>
                                                </View>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}
                        </>
                    ) : (
                        <>
                            {loadingPeserta ? (
                                <View style={styles.stateBox}>
                                    <LoadingState
                                        pesan="Memuat peserta kelas…"
                                        layarPenuh={false}
                                    />
                                </View>
                            ) : errorPeserta ? (
                                <View style={styles.stateBox}>
                                    <ErrorState
                                        pesan={errorPeserta}
                                        onCobaLagi={cobaLagiPeserta}
                                        layarPenuh={false}
                                    />
                                </View>
                            ) : daftarPesertaUrut.length === 0 ? (
                                <EmptyState
                                    judul="Belum ada peserta"
                                    pesan={
                                        kelasAktif.diarsipkan
                                            ? 'Tidak ada praktikan yang tersimpan pada kelas arsip ini.'
                                            : 'Tambahkan praktikan menggunakan 8 karakter kode peserta dari profil mereka.'
                                    }
                                />
                            ) : (
                                <View style={styles.daftarPeserta}>
                                    {daftarPesertaUrut.map((item) => {
                                        const isNonaktif =
                                            item.status === 'NONAKTIF';

                                        return (
                                            <View
                                                key={item.idKeanggotaan}
                                                style={[
                                                    styles.kartuPeserta,
                                                    isNonaktif &&
                                                        styles.kartuRedup,
                                                ]}
                                            >
                                                <View style={styles.avatar}>
                                                    <Text
                                                        style={
                                                            styles.avatarTeks
                                                        }
                                                    >
                                                        {buatInisial(item.nama)}
                                                    </Text>
                                                </View>

                                                <View
                                                    style={styles.infoPeserta}
                                                >
                                                    <View
                                                        style={
                                                            styles.barisNamaPeserta
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.namaPeserta
                                                            }
                                                        >
                                                            {item.nama}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.meta}>
                                                        NIM: {item.nim}
                                                    </Text>
                                                </View>

                                                {isNonaktif ? (
                                                    <View
                                                        style={
                                                            styles.badgeRedup
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.badgeRedupTeks
                                                            }
                                                        >
                                                            Nonaktif
                                                        </Text>
                                                    </View>
                                                ) : !kelasAktif.diarsipkan ? (
                                                    <Pressable
                                                        disabled={
                                                            loadingStatusPeserta
                                                        }
                                                        onPress={() =>
                                                            setPesertaDinonaktifkan(
                                                                item,
                                                            )
                                                        }
                                                        accessibilityRole="button"
                                                        style={({
                                                            pressed,
                                                        }) => [
                                                            styles.tombolBahaya,
                                                            pressed &&
                                                                styles.ditekan,
                                                        ]}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.tombolBahayaTeks
                                                            }
                                                        >
                                                            Nonaktifkan
                                                        </Text>
                                                    </Pressable>
                                                ) : null}
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </View>

            <KelasFormSheet
                visible={editTerbuka}
                mode="ubah"
                nilaiAwal={kelasAktif.namaPraktikum}
                loading={loadingEdit}
                errorPesan={errorEdit}
                onSubmit={handleUbahKelas}
                onTutup={() => {
                    if (!loadingEdit) setEditTerbuka(false);
                }}
            />

            <SesiFormSheet
                visible={formSesiTerbuka}
                mode={modeFormSesi}
                sesiAwal={sesiDiedit}
                loading={loadingSimpanSesi}
                errorPesan={errorFormSesi}
                onSubmit={handleSimpanSesi}
                onTutup={() => {
                    if (!loadingSimpanSesi) {
                        setFormSesiTerbuka(false);
                        setSesiDiedit(null);
                    }
                }}
            />

            <ConfirmSheet
                visible={sesiDiarsipkan !== null}
                judul="Arsipkan sesi?"
                pesan={
                    sesiDiarsipkan
                        ? `Sesi "${sesiDiarsipkan.judul}" akan diarsipkan. Riwayat presensi dan izin tetap tersimpan, tetapi sesi tidak tampil di jadwal aktif.`
                        : ''
                }
                labelKonfirmasi="Arsipkan"
                labelLoading="Mengarsipkan…"
                loading={loadingArsipSesi}
                onKonfirmasi={handleKonfirmasiArsipSesi}
                onBatal={() => {
                    if (!loadingArsipSesi) setSesiDiarsipkan(null);
                }}
            />

            <ConfirmSheet
                visible={arsipTerbuka}
                judul="Arsipkan kelas?"
                pesan={`Kelas "${kelasAktif.namaPraktikum}" akan diarsipkan. Riwayat tetap tersimpan, tetapi peserta dan sesi baru tidak dapat ditambahkan.`}
                labelKonfirmasi="Arsipkan"
                labelLoading="Mengarsipkan…"
                loading={loadingArsip}
                onKonfirmasi={handleArsipkanKelas}
                onBatal={() => {
                    if (!loadingArsip) setArsipTerbuka(false);
                }}
            />

            <TambahPesertaSheet
                visible={tambahPesertaTerbuka}
                loading={loadingTambahPeserta}
                errorPesan={errorTambahPeserta}
                onSubmit={handleTambahPeserta}
                onTutup={() => {
                    if (!loadingTambahPeserta) setTambahPesertaTerbuka(false);
                }}
            />

            <ConfirmSheet
                visible={pesertaDinonaktifkan !== null}
                judul="Nonaktifkan peserta?"
                pesan={
                    pesertaDinonaktifkan
                        ? `${pesertaDinonaktifkan.nama} akan dinonaktifkan dari kelas ini. Riwayat presensi dan izin tetap tersimpan.`
                        : ''
                }
                labelKonfirmasi="Nonaktifkan"
                labelLoading="Menonaktifkan…"
                loading={loadingStatusPeserta}
                onKonfirmasi={handleKonfirmasiNonaktif}
                onBatal={() => {
                    if (!loadingStatusPeserta) setPesertaDinonaktifkan(null);
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    content: {
        padding: 20,
        paddingTop: 16,
        gap: 12,
    },
    headerTetap: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
        gap: 14,
        backgroundColor: Colors.light.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    daftarScroll: {
        flex: 1,
    },
    hero: {
        gap: 14,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundElement,
    },
    heroDiarsipkan: {
        opacity: 0.65,
    },
    heroBarisAtas: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    heroIkon: {
        width: 46,
        height: 46,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.primarySoft,
    },
    heroIkonTeks: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: Colors.light.primary,
    },
    heroJudulWrap: {
        flex: 1,
        gap: 2,
    },
    heroJudul: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 22,
        color: Colors.light.primary,
    },
    heroSub: {
        fontSize: 12,
        color: Colors.light.textSecondary,
    },
    heroBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: Colors.light.successSoft,
    },
    heroBadgeArsip: {
        backgroundColor: Colors.light.border,
    },
    heroBadgeTeks: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.success,
    },
    heroBadgeTeksArsip: {
        color: Colors.light.textSecondary,
    },
    heroBarisBawah: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    heroChip: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: Colors.light.primarySoft,
    },
    heroChipAngka: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.light.primary,
    },
    heroChipLabel: {
        fontSize: 12,
        color: Colors.light.primary,
    },
    heroTombol: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 9,
        backgroundColor: Colors.light.primarySoft,
    },
    heroTombolTeks: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.primary,
    },
    heroTombolBahaya: {
        backgroundColor: '#FEE2E2',
    },
    heroTombolBahayaTeks: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.danger,
    },
    barisAtas: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 10,
    },
    meta: {
        fontSize: 13,
        color: Colors.light.textSecondary,
    },
    stateBox: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundElement,
        padding: 12,
    },
    daftarPeserta: {
        gap: 12,
    },
    kartuRedup: {
        opacity: 0.58,
    },
    badgeRedup: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: Colors.light.border,
    },
    badgeRedupTeks: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.light.textSecondary,
    },
    kartuSesi: {
        flexDirection: 'row',
        overflow: 'hidden',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundElement,
    },
    sesiAksen: {
        width: 5,
        backgroundColor: Colors.light.border,
    },
    sesiAksenAktif: {
        backgroundColor: Colors.light.success,
    },
    sesiIsi: {
        flex: 1,
        gap: 4,
        padding: 14,
    },
    sesiBarisUtama: {
        flexDirection: 'row',
        gap: 12,
    },
    sesiTanggal: {
        width: 50,
        height: 54,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.primarySoft,
    },
    sesiTanggalAktif: {
        backgroundColor: Colors.light.successSoft,
    },
    sesiTanggalAngka: {
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 24,
        color: Colors.light.primary,
    },
    sesiTanggalAngkaAktif: {
        color: Colors.light.success,
    },
    sesiTanggalBulan: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        color: Colors.light.textSecondary,
    },
    sesiInfo: {
        flex: 1,
        gap: 3,
    },
    barisTombolSesi: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    spacer: {
        flex: 1,
    },
    lihatDetailTeks: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    kartuPeserta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundElement,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.accentSoft,
    },
    avatarTeks: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.accent,
    },
    infoPeserta: {
        flex: 1,
        gap: 4,
    },
    barisNamaPeserta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    namaPeserta: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.text,
    },
    tombolSekunder: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.background,
    },
    tombolSekunderTeks: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.text,
    },
    tombolBahaya: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
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
});