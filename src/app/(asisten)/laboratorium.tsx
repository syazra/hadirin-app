import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, Pressable, View, ActivityIndicator } from 'react-native';
import { useLaboratorium } from '@/hooks/use-laboratorium';
import type { Laboratorium } from '@/types';

const KOSONG = { kodeLab: '', nama: '', lokasiGedung: '', latitude: '-7.0482375', longitude: '110.440765625', radiusPresensi: '40', aktif: true };

export default function LaboratoriumScreen() {
  const { daftarLaboratorium, loading, error, tambah, ubah, hapus } = useLaboratorium();
  const [form, setForm] = useState(KOSONG);
  const [editId, setEditId] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  const simpan = async () => {
    const data = {
      kodeLab: form.kodeLab, nama: form.nama, lokasiGedung: form.lokasiGedung,
      latitude: Number(form.latitude), longitude: Number(form.longitude),
      radiusPresensi: Number(form.radiusPresensi), aktif: form.aktif,
    };
    setMenyimpan(true);
    const hasil = editId ? await ubah(editId, data) : await tambah(data);
    setMenyimpan(false);
    if (hasil.ok) {
      setForm(KOSONG);
      setEditId(null);
      Alert.alert('Berhasil', editId ? 'Laboratorium diperbarui.' : 'Laboratorium ditambahkan.');
    } else Alert.alert('Gagal', hasil.pesan);
  };

  const mulaiEdit = (lab: Laboratorium) => {
    setEditId(lab.idLab);
    setForm({ kodeLab: lab.kodeLab, nama: lab.nama, lokasiGedung: lab.lokasiGedung, latitude: String(lab.latitude), longitude: String(lab.longitude), radiusPresensi: String(lab.radiusPresensi), aktif: lab.aktif });
  };

  const konfirmasiHapus = (lab: Laboratorium) => Alert.alert('Hapus laboratorium?', `Hapus ${lab.nama}?`, [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: () => { void hapus(lab.idLab); } },
  ]);

  const field = (label: string, key: keyof typeof form, numeric = false) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={String(form[key])} keyboardType={numeric ? 'numeric' : 'default'} onChangeText={(value) => setForm((old) => ({ ...old, [key]: value }))} />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Manajemen Laboratorium</Text>
      <Text style={styles.subtitle}>Kelola data laboratorium untuk lokasi presensi.</Text>

      <View style={styles.card}>
        <Text style={styles.heading}>{editId ? 'Edit Laboratorium' : 'Tambah Laboratorium'}</Text>
        {field('Kode laboratorium', 'kodeLab')}
        {field('Nama laboratorium', 'nama')}
        {field('Lokasi gedung', 'lokasiGedung')}
        {field('Latitude', 'latitude', true)}
        {field('Longitude', 'longitude', true)}
        {field('Radius presensi (meter)', 'radiusPresensi', true)}
        <Pressable style={styles.switch} onPress={() => setForm((old) => ({ ...old, aktif: !old.aktif }))}>
          <Text style={styles.label}>Status: {form.aktif ? 'Aktif' : 'Tidak aktif'} (tekan untuk ubah)</Text>
        </Pressable>
        <Pressable style={styles.primary} disabled={menyimpan} onPress={() => void simpan()}>
          {menyimpan ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{editId ? 'Simpan Perubahan' : 'Tambah Laboratorium'}</Text>}
        </Pressable>
        {editId && <Pressable onPress={() => { setEditId(null); setForm(KOSONG); }}><Text style={styles.cancel}>Batal edit</Text></Pressable>}
      </View>

      <Text style={styles.heading}>Daftar Laboratorium ({daftarLaboratorium.length})</Text>
      {loading ? <ActivityIndicator /> : error ? <Text style={styles.error}>{error}</Text> : daftarLaboratorium.map((lab) => (
        <View key={lab.idLab} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.labName}>{lab.nama} ({lab.kodeLab})</Text>
            <Text style={lab.aktif ? styles.active : styles.inactive}>{lab.aktif ? 'Aktif' : 'Nonaktif'}</Text>
          </View>
          <Text style={styles.subtitle}>{lab.lokasiGedung}</Text>
          <Text style={styles.subtitle}>Koordinat: {lab.latitude}, {lab.longitude} · Radius {lab.radiusPresensi} m</Text>
          <View style={styles.row}>
            <Pressable onPress={() => mulaiEdit(lab)}><Text style={styles.action}>Edit</Text></Pressable>
            <Pressable onPress={() => konfirmasiHapus(lab)}><Text style={styles.delete}>Hapus</Text></Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { padding: 18, paddingBottom: 40 },
  title: { fontSize: 23, fontWeight: '700', color: '#172033' },
  subtitle: { color: '#687386', marginTop: 5, fontSize: 13 },
  heading: { fontSize: 17, fontWeight: '700', color: '#172033', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginTop: 14, marginBottom: 12 },
  field: { marginBottom: 10 },
  label: { color: '#475467', fontSize: 13, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#D9DEE7', borderRadius: 8, padding: 10, color: '#172033' },
  switch: { paddingVertical: 10 },
  primary: { backgroundColor: '#2563EB', padding: 13, borderRadius: 9, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '700' },
  cancel: { textAlign: 'center', color: '#475467', marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  labName: { fontSize: 16, fontWeight: '700', color: '#172033' },
  active: { color: '#15803D', fontWeight: '600' },
  inactive: { color: '#B45309', fontWeight: '600' },
  action: { color: '#2563EB', fontWeight: '700', paddingTop: 14 },
  delete: { color: '#DC2626', fontWeight: '700', paddingTop: 14 },
  error: { color: '#DC2626', marginTop: 10 },
});
