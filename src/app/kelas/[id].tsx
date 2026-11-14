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
    ubahStatusPeserta,
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

export default function DetailKelasScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const kelasId = typeof id === 'string' ? id : '';

    const { pengguna } = useAuth();
    const {
        kelas,
        loading: loadingKelas,
        error: errorKelas,
        cobaLagi: cobaLagiKelas,
    } = useKelasAsisten(pengguna?.uid ?? null);

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
        if (!kelasAktif) return;
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
        if (!kelasAktif || loadingArsip) return;
        setLoadingArsip(true);

        const hasil = await arsipkanKelas(kelasAktif.idKelas);
        setLoadingArsip(false);

        if (!hasil.ok) {
            Alert.alert('Gagal mengarsipkan kelas', hasil.pesan);
            return;
        }

        setArsipTerbuka(false);
        router.back();
    };

    const handleTambahPeserta = async (kodePeserta: string) => {
        if (!kelasAktif) return;
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
        if (!pesertaDinonaktifkan || loadingStatusPeserta) return;
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

    const handleAktifkanPeserta = async (item: Keanggotaan) => {
        if (loadingStatusPeserta) return;
        setLoadingStatusPeserta(true);

        const hasil = await ubahStatusPeserta(item.idKeanggotaan, 'AKTIF');
        setLoadingStatusPeserta(false);

        if (!hasil.ok) {
            Alert.alert('Gagal mengaktifkan peserta', hasil.pesan);
        }
    };

    const handleSimpanSesi = async (nilai: NilaiFormSesi) => {
        if (!kelasAktif || loadingSimpanSesi) return;
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
        if (!sesiDiarsipkan || loadingArsipSesi) return;
        setLoadingArsipSesi(true);

        const hasil = await arsipkanSesi(sesiDiarsipkan.idSesi);
        setLoadingArsipSesi(false);

        if (!hasil.ok) {
            Alert.alert('Gagal mengarsipkan sesi', hasil.pesan);
            return;
        }

        setSesiDiarsipkan(null);
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
                        pesan="Kelas mungkin sudah diarsipkan atau Anda tidak memiliki akses ke kelas ini."
                    />
                </View>
            </>
        );
    }

    const jumlahAktif = peserta.filter((p) => p.status === 'AKTIF').length;
    const jumlahNonaktif = peserta.filter(
        (p) => p.status === 'NONAKTIF',
    ).length;

    return (
        <>
            <Stack.Screen
                options={{ title: kelasAktif.namaPraktikum || 'Detail Kelas' }}
            />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
            >
                {/* Ringkasan Kelas */}
                <View style={styles.kartuKelas}>
                    <View style={styles.barisAtas}>
                        <Text style={styles.judulKelas}>
                            {kelasAktif.namaPraktikum}
                        </Text>
                        <View
                            style={[
                                styles.badge,
                                kelasAktif.diarsipkan
                                    ? styles.badgeArsip
                                    : styles.badgeAktif,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.badgeTeks,
                                    kelasAktif.diarsipkan
                                        ? styles.badgeTeksArsip
                                        : styles.badgeTeksAktif,
                                ]}
                            >
                                {kelasAktif.diarsipkan ? 'Diarsipkan' : 'Aktif'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.meta}>
                        Dibuat:{' '}
                        {kelasAktif.dibuatPada
                            ? formatWaktu(kelasAktif.dibuatPada.toISOString())
                            : 'Memproses…'}
                    </Text>

                    <Text style={styles.meta}>
                        Peserta: {jumlahAktif} aktif
                        {jumlahNonaktif > 0
                            ? ` · ${jumlahNonaktif} nonaktif`
                            : ''}
                    </Text>

                    {!kelasAktif.diarsipkan ? (
                        <View style={styles.barisTombolKelas}>
                            <Pressable
                                onPress={() => {
                                    setErrorEdit(null);
                                    setEditTerbuka(true);
                                }}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.tombolSekunder,
                                    pressed && styles.ditekan,
                                ]}
                            >
                                <Text style={styles.tombolSekunderTeks}>
                                    Ubah nama
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => setArsipTerbuka(true)}
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.tombolBahaya,
                                    pressed && styles.ditekan,
                                ]}
                            >
                                <Text style={styles.tombolBahayaTeks}>
                                    Arsipkan kelas
                                </Text>
                            </Pressable>
                        </View>
                    ) : null}
                </View>

                {/* Daftar Sesi Praktikum */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Sesi Praktikum</Text>
                    {!kelasAktif.diarsipkan ? (
                        <Pressable
                            onPress={() => {
                                setModeFormSesi('tambah');
                                setSesiDiedit(null);
                                setErrorFormSesi(null);
                                setFormSesiTerbuka(true);
                            }}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                                styles.tombolTambah,
                                pressed && styles.ditekan,
                            ]}
                        >
                            <Text style={styles.tombolTambahTeks}>
                                + Tambah sesi
                            </Text>
                        </Pressable>
                    ) : null}
                </View>

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
                ) : sesiKelas.length === 0 ? (
                    <EmptyState
                        judul="Belum ada sesi"
                        pesan="Tambahkan sesi praktikum untuk mulai mengelola jadwal dan presensi."
                    />
                ) : (
                    <View style={styles.daftarPeserta}>
                        {sesiKelas.map((item) => (
                            <Pressable
                                key={item.idSesi}
                                onPress={() =>
                                    router.push({
                                        pathname: '/sesi/[id]',
                                        params: { id: item.idSesi },
                                    })
                                }
                                style={({ pressed }) => [
                                    styles.kartuSesi,
                                    pressed && styles.ditekan,
                                ]}
                            >
                                <View style={styles.barisAtas}>
                                    <Text style={styles.namaPeserta}>
                                        {item.judul}
                                    </Text>
                                    <StatusBadge status={item.statusSesi} />
                                </View>

                                <Text style={styles.meta}>
                                    Lokasi: {item.lokasi}
                                </Text>
                                <Text style={styles.meta}>
                                    Mulai:{' '}
                                    {formatWaktu(item.waktuMulai.toISOString())}
                                    {item.waktuSelesai
                                        ? ` · Selesai: ${formatWaktu(item.waktuSelesai.toISOString())}`
                                        : ''}
                                </Text>

                                <View style={styles.barisTombolSesi}>
                                    {!kelasAktif.diarsipkan ? (
                                        <Pressable
                                            onPress={() => {
                                                setModeFormSesi('ubah');
                                                setSesiDiedit(item);
                                                setErrorFormSesi(null);
                                                setFormSesiTerbuka(true);
                                            }}
                                            accessibilityRole="button"
                                            style={({ pressed }) => [
                                                styles.tombolSekunder,
                                                pressed && styles.ditekan,
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

                                    {item.statusSesi !== 'DIBUKA' ? (
                                        <Pressable
                                            onPress={() =>
                                                setSesiDiarsipkan(item)
                                            }
                                            accessibilityRole="button"
                                            style={({ pressed }) => [
                                                styles.tombolBahaya,
                                                pressed && styles.ditekan,
                                            ]}
                                        >
                                            <Text
                                                style={styles.tombolBahayaTeks}
                                            >
                                                Arsipkan
                                            </Text>
                                        </Pressable>
                                    ) : null}

                                    <View style={styles.spacer} />
                                    <Text style={styles.lihatDetailTeks}>
                                        Detail sesi ›
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Daftar Peserta */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Peserta Kelas</Text>
                    {!kelasAktif.diarsipkan ? (
                        <Pressable
                            onPress={() => {
                                setErrorTambahPeserta(null);
                                setTambahPesertaTerbuka(true);
                            }}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                                styles.tombolTambah,
                                pressed && styles.ditekan,
                            ]}
                        >
                            <Text style={styles.tombolTambahTeks}>
                                + Tambah peserta
                            </Text>
                        </Pressable>
                    ) : null}
                </View>

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
                ) : peserta.length === 0 ? (
                    <EmptyState
                        judul="Belum ada peserta"
                        pesan="Tambahkan praktikan menggunakan 8 karakter kode peserta dari profil mereka."
                    />
                ) : (
                    <View style={styles.daftarPeserta}>
                        {peserta.map((item) => {
                            const aktif = item.status === 'AKTIF';
                            return (
                                <View
                                    key={item.idKeanggotaan}
                                    style={[
                                        styles.kartuPeserta,
                                        !aktif && styles.kartuPesertaNonaktif,
                                    ]}
                                >
                                    <View style={styles.infoPeserta}>
                                        <View style={styles.barisNamaPeserta}>
                                            <Text style={styles.namaPeserta}>
                                                {item.nama}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.badge,
                                                    aktif
                                                        ? styles.badgeAktif
                                                        : styles.badgeArsip,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.badgeTeks,
                                                        aktif
                                                            ? styles.badgeTeksAktif
                                                            : styles.badgeTeksArsip,
                                                    ]}
                                                >
                                                    {aktif
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.meta}>
                                            NIM: {item.nim}
                                        </Text>
                                    </View>

                                    {!kelasAktif.diarsipkan ? (
                                        aktif ? (
                                            <Pressable
                                                disabled={loadingStatusPeserta}
                                                onPress={() =>
                                                    setPesertaDinonaktifkan(
                                                        item,
                                                    )
                                                }
                                                accessibilityRole="button"
                                                style={({ pressed }) => [
                                                    styles.tombolBahaya,
                                                    pressed && styles.ditekan,
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
                                        ) : (
                                            <Pressable
                                                disabled={loadingStatusPeserta}
                                                onPress={() =>
                                                    handleAktifkanPeserta(item)
                                                }
                                                accessibilityRole="button"
                                                style={({ pressed }) => [
                                                    styles.tombolSekunder,
                                                    pressed && styles.ditekan,
                                                ]}
                                            >
                                                <Text
                                                    style={
                                                        styles.tombolSekunderTeks
                                                    }
                                                >
                                                    Aktifkan
                                                </Text>
                                            </Pressable>
                                        )
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

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
        gap: 16,
    },
    kartuKelas: {
        backgroundColor: Colors.light.backgroundElement,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 14,
        padding: 16,
        gap: 8,
    },
    barisAtas: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 10,
    },
    judulKelas: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
    },
    meta: {
        fontSize: 13,
        color: Colors.light.textSecondary,
    },
    barisTombolKelas: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.light.text,
    },
    tombolTambah: {
        minHeight: 38,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tombolTambahTeks: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.light.backgroundElement,
    },
    stateBox: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundElement,
        padding: 12,
    },
    daftarPeserta: {
        gap: 10,
    },
    kartuSesi: {
        gap: 8,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundElement,
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.backgroundElement,
    },
    kartuPesertaNonaktif: {
        opacity: 0.7,
        backgroundColor: Colors.light.background,
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
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    badgeAktif: {
        backgroundColor: '#E6F4FE',
    },
    badgeArsip: {
        backgroundColor: Colors.light.border,
    },
    badgeTeks: {
        fontSize: 11,
        fontWeight: '600',
    },
    badgeTeksAktif: {
        color: Colors.light.primary,
    },
    badgeTeksArsip: {
        color: Colors.light.textSecondary,
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