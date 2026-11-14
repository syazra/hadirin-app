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
import { useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function KelasScreen() {
    const router = useRouter();
    const { pengguna } = useAuth();
    const { kelas, loading, error, cobaLagi } = useKelasAsisten(
        pengguna?.uid ?? null,
    );

    const [formTerbuka, setFormTerbuka] = useState(false);
    const [kelasDiedit, setKelasDiedit] = useState<Kelas | null>(null);
    const [loadingForm, setLoadingForm] = useState(false);
    const [errorForm, setErrorForm] = useState<string | null>(null);

    const [kelasDiarsip, setKelasDiarsip] = useState<Kelas | null>(null);
    const [loadingArsip, setLoadingArsip] = useState(false);

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
                        Kelola kelas, peserta, dan sesi presensi Anda.
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

            {kelas.length === 0 ? (
                <EmptyState
                    judul="Belum ada kelas"
                    pesan="Tambahkan kelas praktikum pertama Anda untuk mulai mengelola peserta dan sesi."
                />
            ) : (
                <FlatList
                    data={kelas}
                    keyExtractor={(item) => item.idKelas}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <KelasCard
                            kelas={item}
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
                        ? `Kelas "${kelasDiarsip.namaPraktikum}" akan diarsipkan. Riwayat tetap tersimpan, tetapi peserta dan sesi baru tidak dapat ditambahkan.`
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
        marginTop: 2,
        fontSize: 13,
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
    ditekan: {
        opacity: 0.75,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 24,
        gap: 12,
    },
});