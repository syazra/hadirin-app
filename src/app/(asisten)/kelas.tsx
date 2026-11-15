import { KelasCard } from '@/components/asisten/kelas-card';
import { KelasFormSheet } from '@/components/asisten/kelas-form-sheet';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useKelasAsisten } from '@/hooks/use-kelas-asisten';
import {
    arsipkanKelas,
    tambahKelas,
    ubahKelas,
} from '@/services/kelas-service';
import type { Kelas } from '@/types';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type FilterKelas = 'SEMUA' | 'AKTIF' | 'DIARSIPKAN';

export default function KelasScreen() {
    const router = useRouter();
    const { pengguna } = useAuth();
    const { kelas, jumlahPesertaPerKelas, loading, error, cobaLagi } =
        useKelasAsisten(pengguna?.uid ?? null, { sertakanArsip: true });

    const [filter, setFilter] = useState<FilterKelas>('SEMUA');

    const [formTerbuka, setFormTerbuka] = useState(false);
    const [kelasDiedit, setKelasDiedit] = useState<Kelas | null>(null);
    const [loadingForm, setLoadingForm] = useState(false);
    const [errorForm, setErrorForm] = useState<string | null>(null);

    const [kelasDiarsip, setKelasDiarsip] = useState<Kelas | null>(null);
    const [loadingArsip, setLoadingArsip] = useState(false);

    const { jumlahAktif, jumlahDiarsipkan, kelasTampil } = useMemo(() => {
        const aktif = kelas.filter((item) => !item.diarsipkan);
        const diarsipkan = kelas.filter((item) => item.diarsipkan);

        const hasilFilter =
            filter === 'AKTIF'
                ? aktif
                : filter === 'DIARSIPKAN'
                  ? diarsipkan
                  : [...aktif, ...diarsipkan];

        return {
            jumlahAktif: aktif.length,
            jumlahDiarsipkan: diarsipkan.length,
            kelasTampil: hasilFilter,
        };
    }, [kelas, filter]);

    const opsiFilter: { key: FilterKelas; label: string; jumlah: number }[] = [
        { key: 'SEMUA', label: 'Semua', jumlah: kelas.length },
        { key: 'AKTIF', label: 'Aktif', jumlah: jumlahAktif },
        { key: 'DIARSIPKAN', label: 'Diarsipkan', jumlah: jumlahDiarsipkan },
    ];

    const bukaFormTambah = () => {
        setKelasDiedit(null);
        setErrorForm(null);
        setFormTerbuka(true);
    };

    const bukaFormEdit = (item: Kelas) => {
        setKelasDiedit(item);
        setErrorForm(null);
        setFormTerbuka(true);
    };

    const tutupForm = () => {
        if (loadingForm) return;
        setFormTerbuka(false);
        setKelasDiedit(null);
        setErrorForm(null);
    };

    const handleSubmitForm = async (namaPraktikum: string) => {
        setLoadingForm(true);
        setErrorForm(null);

        const hasil = kelasDiedit
            ? await ubahKelas(kelasDiedit.idKelas, { namaPraktikum })
            : await tambahKelas(namaPraktikum);

        setLoadingForm(false);

        if (!hasil.ok) {
            setErrorForm(hasil.pesan);
            return;
        }

        setFormTerbuka(false);
        setKelasDiedit(null);
    };

    const handleKonfirmasiArsip = async () => {
        if (!kelasDiarsip || loadingArsip) return;

        setLoadingArsip(true);
        const hasil = await arsipkanKelas(kelasDiarsip.idKelas);
        setLoadingArsip(false);

        if (!hasil.ok) {
            Alert.alert('Gagal mengarsipkan kelas', hasil.pesan);
            return;
        }

        setKelasDiarsip(null);
    };

    if (loading) {
        return <LoadingState pesan="Memuat daftar kelas..." />;
    }

    if (error) {
        return <ErrorState pesan={error} onCobaLagi={cobaLagi} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTeks}>
                    <Text style={styles.title} accessibilityRole="header">
                        Kelas Praktikum
                    </Text>
                    <Text style={styles.subtitle}>
                        Kelola kelas, praktikan, dan sesi presensi Anda.
                    </Text>
                </View>

                <Pressable
                    onPress={bukaFormTambah}
                    accessibilityRole="button"
                    accessibilityLabel="Tambah kelas"
                    style={({ pressed }) => [
                        styles.tombolTambah,
                        pressed && styles.ditekan,
                    ]}
                >
                    <Text style={styles.tombolTambahTeks}>+ Tambah</Text>
                </Pressable>
            </View>

            <View style={styles.filterRow}>
                {opsiFilter.map((opsi) => {
                    const aktif = filter === opsi.key;
                    return (
                        <Pressable
                            key={opsi.key}
                            onPress={() => setFilter(opsi.key)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: aktif }}
                            style={({ pressed }) => [
                                styles.filterChip,
                                aktif && styles.filterChipAktif,
                                pressed && styles.ditekan,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.filterChipTeks,
                                    aktif && styles.filterChipTeksAktif,
                                ]}
                            >
                                {opsi.label}
                            </Text>
                            <View
                                style={[
                                    styles.filterBadge,
                                    aktif && styles.filterBadgeAktif,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterBadgeTeks,
                                        aktif && styles.filterBadgeTeksAktif,
                                    ]}
                                >
                                    {opsi.jumlah}
                                </Text>
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            {kelas.length === 0 ? (
                <EmptyState
                    judul="Belum ada kelas"
                    pesan="Tambahkan kelas praktikum pertama Anda untuk mulai mengelola praktikan dan sesi."
                />
            ) : kelasTampil.length === 0 ? (
                <EmptyState
                    judul={
                        filter === 'DIARSIPKAN'
                            ? 'Belum ada kelas diarsipkan'
                            : 'Belum ada kelas aktif'
                    }
                    pesan="Ubah filter di atas untuk melihat daftar kelas lainnya."
                />
            ) : (
                <FlatList
                    data={kelasTampil}
                    keyExtractor={(item) => item.idKelas}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <KelasCard
                            kelas={item}
                            jumlahPeserta={jumlahPesertaPerKelas[item.idKelas]}
                            onPress={() =>
                                router.push({
                                    pathname: '/kelas/[id]',
                                    params: { id: item.idKelas },
                                })
                            }
                            onEdit={() => bukaFormEdit(item)}
                            onArsip={() => setKelasDiarsip(item)}
                        />
                    )}
                />
            )}

            <KelasFormSheet
                visible={formTerbuka}
                mode={kelasDiedit ? 'ubah' : 'tambah'}
                nilaiAwal={kelasDiedit?.namaPraktikum ?? ''}
                loading={loadingForm}
                errorPesan={errorForm}
                onSubmit={handleSubmitForm}
                onTutup={tutupForm}
            />

            <ConfirmSheet
                visible={kelasDiarsip !== null}
                judul="Arsipkan kelas?"
                pesan={
                    kelasDiarsip
                        ? `Kelas "${kelasDiarsip.namaPraktikum}" akan diarsipkan. Riwayat tetap tersimpan, tetapi praktikan dan sesi baru tidak dapat ditambahkan.`
                        : ''
                }
                labelKonfirmasi="Arsipkan"
                labelLoading="Mengarsipkan…"
                loading={loadingArsip}
                onKonfirmasi={handleKonfirmasiArsip}
                onBatal={() => {
                    if (!loadingArsip) setKelasDiarsip(null);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    headerTeks: {
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.light.text,
    },
    subtitle: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 18,
        color: Colors.light.textSecondary,
    },
    tombolTambah: {
        minHeight: 40,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tombolTambahTeks: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.backgroundElement,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 20,
        paddingBottom: 14,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: '#EEF3FA',
    },
    filterChipAktif: {
        backgroundColor: Colors.light.primary,
    },
    filterChipTeks: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.text,
    },
    filterChipTeksAktif: {
        color: Colors.light.backgroundElement,
    },
    filterBadge: {
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        borderRadius: 999,
        backgroundColor: '#DCE6F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBadgeAktif: {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    filterBadgeTeks: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.light.primary,
    },
    filterBadgeTeksAktif: {
        color: Colors.light.backgroundElement,
    },
    ditekan: {
        opacity: 0.75,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 2,
        paddingBottom: 24,
        gap: 12,
    },
});