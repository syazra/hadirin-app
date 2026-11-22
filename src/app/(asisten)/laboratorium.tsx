import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, Pressable, View, ActivityIndicator } from 'react-native';
import { useLaboratorium } from '@/hooks/use-laboratorium';
import type { Laboratorium } from '@/types';
import LaboratoryPickerMap from '@/components/maps/laboratory-picker-map';

const KOSONG = {
  kodeLab: '',
  nama: '',
  lokasiGedung: '',
  latitude: '',
  longitude: '',
  radiusPresensi: '',
  aktif: true,
};

export default function LaboratoriumScreen() {
  const { daftarLaboratorium, loading, error, tambah, ubah, hapus } = useLaboratorium();
  const [form, setForm] = useState(KOSONG);
  const [editId, setEditId] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const simpan = async () => {
    if (!form.latitude.trim() || !form.longitude.trim()) {
      Alert.alert('Lokasi belum dipilih', 'Pilih titik laboratorium pada peta atau isi koordinat secara manual.');
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const radiusPresensi = Number(form.radiusPresensi);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radiusPresensi)) {
      Alert.alert('Input tidak valid', 'Pastikan koordinat dan radius berupa angka yang valid.');
      return;
    }

    const data = {
      kodeLab: form.kodeLab,
      nama: form.nama,
      lokasiGedung: form.lokasiGedung,
      latitude,
      longitude,
      radiusPresensi,
      aktif: form.aktif,
    };

    setMenyimpan(true);
    try {
      const hasil = editId ? await ubah(editId, data) : await tambah(data);
      if (hasil.ok) {
        setForm(KOSONG);
        setEditId(null);
        Alert.alert('Berhasil', editId ? 'Laboratorium diperbarui.' : 'Laboratorium ditambahkan.');
      } else {
        Alert.alert('Gagal', hasil.pesan);
      }
    } finally {
      setMenyimpan(false);
    }
  };

  const mulaiEdit = (lab: Laboratorium) => {
    setEditId(lab.idLab);
    setForm({
      kodeLab: lab.kodeLab,
      nama: lab.nama,
      lokasiGedung: lab.lokasiGedung,
      latitude: String(lab.latitude),
      longitude: String(lab.longitude),
      radiusPresensi: String(lab.radiusPresensi),
      aktif: lab.aktif,
    });
  };

  const konfirmasiHapus = (lab: Laboratorium) =>
    Alert.alert('Hapus laboratorium?', `Hapus ${lab.nama}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => { void hapus(lab.idLab); } },
    ]);

  const field = (
    label: string,
    key: keyof typeof form,
    numeric = false,
    placeholder = '',
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={String(form[key])}
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        onChangeText={(value) =>
          setForm((old) => ({ ...old, [key]: value }))
        }
      />
    </View>
  );

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Manajemen Laboratorium</Text>
        <Text style={styles.subtitle}>Kelola data laboratorium untuk lokasi presensi.</Text>

        <View style={styles.card}>
          <Text style={styles.heading}>{editId ? 'Edit Laboratorium' : 'Tambah Laboratorium'}</Text>
          {field('Kode laboratorium', 'kodeLab')}
          {field('Nama laboratorium', 'nama')}
          {field('Lokasi gedung', 'lokasiGedung')}

          <Text style={styles.label}>Koordinat laboratorium</Text>
          <Pressable style={styles.pickButton} onPress={() => setPickerVisible(true)}>
            <Text style={styles.pickButtonText}>Pilih Titik pada Peta</Text>
          </Pressable>
          {field('Latitude', 'latitude', true, 'Contoh: -7.0512')}
          {field('Longitude', 'longitude', true, 'Contoh: 110.4405')}
          {field('Radius presensi (meter)', 'radiusPresensi', true, 'Contoh: 40')}

          <Pressable style={styles.switch} onPress={() => setForm((old) => ({ ...old, aktif: !old.aktif }))}>
            <Text style={styles.label}>Status: {form.aktif ? 'Aktif' : 'Tidak aktif'} (tekan untuk ubah)</Text>
          </Pressable>
          <Pressable style={styles.primary} disabled={menyimpan} onPress={() => void simpan()}>
            {menyimpan ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{editId ? 'Simpan Perubahan' : 'Tambah Laboratorium'}</Text>}
          </Pressable>
          {editId && (
            <Pressable onPress={() => { setEditId(null); setForm(KOSONG); }}>
              <Text style={styles.cancel}>Batal edit</Text>
            </Pressable>
          )}
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

      <LaboratoryPickerMap
        visible={pickerVisible}
        initialCoordinate={form.latitude && form.longitude ? { latitude: Number(form.latitude), longitude: Number(form.longitude) } : null}
        onClose={() => setPickerVisible(false)}
        onConfirm={(coordinate) => {
          setForm((old) => ({
            ...old,
            latitude: String(coordinate.latitude),
            longitude: String(coordinate.longitude),
          }));
          setPickerVisible(false);
        }}
      />
    </>
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
  pickButton: { backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  pickButtonText: { color: '#175CD3', fontWeight: '700' },
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