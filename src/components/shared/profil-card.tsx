import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { Colors, Spacing } from '@/constants/theme';
import { keluar } from '@/services/auth-service';
import type { Pengguna } from '@/types';

interface ProfilCardProps {
    pengguna: Pengguna;
}

export function ProfilCard({ pengguna }: ProfilCardProps) {
    const [menyalin, setMenyalin] = useState(false);
    const [keluarMemuat, setKeluarMemuat] = useState(false);
    const [pesan, setPesan] = useState<string | null>(null);

    async function salinKode() {
        setMenyalin(true);
        setPesan(null);
        try {
            const berhasil = await Clipboard.setStringAsync(pengguna.kodePeserta);
            setPesan(berhasil ? 'Kode peserta berhasil disalin.' : 'Kode peserta tidak dapat disalin.');
        } catch {
            setPesan('Kode peserta tidak dapat disalin.');
        } finally {
            setMenyalin(false);
        }
    }

    async function handleKeluar() {
        setKeluarMemuat(true);
        setPesan(null);
        const hasil = await keluar();
        if (!hasil.ok) setPesan(hasil.pesan);
        setKeluarMemuat(false);
    }

    return (
        <View style={styles.card}>
            <View style={styles.heading}>
                <Text accessibilityRole="header" style={styles.title}>{pengguna.nama}</Text>
                <Text style={styles.role}>{pengguna.peran === 'ASISTEN' ? 'Asisten' : 'Praktikan'}</Text>
            </View>

            <View style={styles.rows}>
                <Baris label="NIM" value={pengguna.nim} />
                <Baris label="Email" value={pengguna.email} />
                <Baris label="Kode peserta" value={pengguna.kodePeserta} />
            </View>

            <AppButton fullWidth loading={menyalin} onPress={salinKode} title="Salin kode peserta" variant="outline" />
            {pesan && <Text accessibilityRole="alert" style={styles.message}>{pesan}</Text>}
            <AppButton fullWidth loading={keluarMemuat} onPress={handleKeluar} title="Keluar" variant="danger" />
        </View>
    );
}

function Baris({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text selectable style={styles.value}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { gap: Spacing.three, backgroundColor: Colors.light.card, borderColor: Colors.light.border, borderWidth: 1, borderRadius: 16, padding: Spacing.four },
    heading: { gap: Spacing.one },
    title: { color: Colors.light.text, fontSize: 22, fontWeight: '700' },
    role: { color: Colors.light.primary, fontSize: 14, fontWeight: '600' },
    rows: { gap: Spacing.two },
    row: { gap: 4 },
    label: { color: Colors.light.textSecondary, fontSize: 13 },
    value: { color: Colors.light.text, fontSize: 16 },
    message: { color: Colors.light.textSecondary, fontSize: 14 },
});
