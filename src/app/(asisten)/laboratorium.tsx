import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import LaboratoryPickerMap from '@/components/maps/laboratory-picker-map';
import { AppButton } from '@/components/ui/app-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import {
  IconArchive,
  IconCheck,
  IconCheckCircle,
  IconCrosshair,
  IconEdit,
  IconFlask,
  IconMapPin,
  IconPlus,
} from '@/components/ui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import {
  EnterView,
  LivePulseDot,
  PressableScale,
} from '@/components/ui/motion';
import { getStaggerDelay } from '@/constants/motion';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useLaboratorium } from '@/hooks/use-laboratorium';
import type { Laboratorium } from '@/types';

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
  const { daftarLaboratorium, loading, error, tambah, ubah, ubahStatusAktif } =
    useLaboratorium();
  const [form, setForm] = useState(KOSONG);
  const [editId, setEditId] = useState<string | null>(null);
  const [sheetTerbuka, setSheetTerbuka] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [labDinonaktifkan, setLabDinonaktifkan] = useState<Laboratorium | null>(
    null,
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const jumlahAktif = daftarLaboratorium.filter((item) => item.aktif).length;

  const bukaTambah = () => {
    setEditId(null);
    setForm(KOSONG);
    setSheetTerbuka(true);
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
    setSheetTerbuka(true);
  };

  const tutupSheet = () => {
    if (menyimpan) return;
    setSheetTerbuka(false);
    setEditId(null);
    setForm(KOSONG);
  };

  const simpan = async () => {
    if (!form.latitude.trim() || !form.longitude.trim()) {
      Alert.alert(
        'Lokasi belum dipilih',
        'Pilih titik laboratorium pada peta atau isi koordinat secara manual.',
      );
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const radiusPresensi = Number(form.radiusPresensi);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radiusPresensi)
    ) {
      Alert.alert(
        'Input tidak valid',
        'Pastikan koordinat dan radius berupa angka yang valid.',
      );
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
        setSheetTerbuka(false);
        setForm(KOSONG);
        setEditId(null);
        Alert.alert(
          'Berhasil',
          editId ? 'Laboratorium diperbarui.' : 'Laboratorium ditambahkan.',
        );
      } else {
        Alert.alert('Gagal', hasil.pesan);
      }
    } finally {
      setMenyimpan(false);
    }
  };

  const jalankanToggleStatus = async (lab: Laboratorium, aktifBaru: boolean) => {
    if (togglingId) return;
    setTogglingId(lab.idLab);
    try {
      const hasil = await ubahStatusAktif(lab, aktifBaru);
      if (hasil.ok) {
        if (editId === lab.idLab) {
          setForm((old) => ({ ...old, aktif: aktifBaru }));
        }
        setLabDinonaktifkan(null);
      } else {
        Alert.alert('Gagal', hasil.pesan);
      }
    } finally {
      setTogglingId(null);
    }
  };

  const renderField = (
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
        placeholderTextColor={Colors.light.textSecondary}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        editable={!menyimpan}
        onChangeText={(value) => setForm((old) => ({ ...old, [key]: value }))}
      />
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.summaryPill}>
            <IconFlask size={15} color={Colors.light.brandMid} />
            <Text style={styles.summaryText}>
              {jumlahAktif} Lab Aktif
            </Text>
          </View>

          <PressableScale
            onPress={bukaTambah}
            scaleTo={0.94}
            accessibilityRole="button"
            accessibilityLabel="Tambah laboratorium"
            style={styles.addButton}
          >
            <IconPlus size={16} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.addButtonText}>Tambah</Text>
          </PressableScale>
        </View>

        {loading ? (
          <LoadingState pesan="Memuat daftar laboratorium..." />
        ) : error ? (
          <ErrorState judul="Gagal memuat laboratorium" pesan={error} />
        ) : daftarLaboratorium.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              judul="Belum ada laboratorium"
              pesan="Tambahkan lokasi laboratorium untuk validasi presensi."
              icon={<IconFlask size={26} color={Colors.light.brandMid} />}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {daftarLaboratorium.map((lab, index) => (
              <EnterView
                key={lab.idLab}
                delay={getStaggerDelay(index)}
                animateLayout
              >
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.codeTile}>
                      <Text style={styles.codeText} numberOfLines={1}>
                        {lab.kodeLab}
                      </Text>
                    </View>

                    <View style={styles.titleWrap}>
                      <Text style={styles.labName} numberOfLines={2}>
                        {lab.nama}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        lab.aktif ? styles.statusActive : styles.statusInactive,
                      ]}
                    >
                      {lab.aktif ? (
                        <LivePulseDot color={Colors.light.success} size={6} />
                      ) : (
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: Colors.light.warning },
                          ]}
                        />
                      )}
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: lab.aktif
                              ? Colors.light.success
                              : Colors.light.warning,
                          },
                        ]}
                      >
                        {lab.aktif ? 'Aktif' : 'Nonaktif'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chipsRow}>
                    <View style={styles.infoChip}>
                      <IconMapPin size={13} color={Colors.light.teal} />
                      <Text style={styles.infoChipText} numberOfLines={1}>
                        {lab.lokasiGedung}
                      </Text>
                    </View>

                    <View style={styles.infoChip}>
                      <IconCrosshair size={13} color={Colors.light.warm} />
                      <Text style={styles.infoChipText}>
                        Radius {lab.radiusPresensi}m
                      </Text>
                    </View>
                  </View>

                  <View style={styles.coordPill}>
                    <Text style={styles.coordText}>
                      {lab.latitude.toFixed(6)}, {lab.longitude.toFixed(6)}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <PressableScale
                      onPress={() => mulaiEdit(lab)}
                      scaleTo={0.94}
                      style={styles.editPill}
                    >
                      <IconEdit size={13.5} color={Colors.light.text} />
                      <Text style={styles.editText}>Ubah</Text>
                    </PressableScale>

                    <PressableScale
                      disabled={togglingId === lab.idLab}
                      scaleTo={0.94}
                      onPress={() => {
                        if (lab.aktif) {
                          setLabDinonaktifkan(lab);
                          return;
                        }
                        void jalankanToggleStatus(lab, true);
                      }}
                      style={[
                        lab.aktif ? styles.deactivatePill : styles.activatePill,
                        togglingId === lab.idLab && styles.disabled,
                      ]}
                    >
                      {lab.aktif ? (
                        <IconArchive size={13.5} color={Colors.light.warning} />
                      ) : (
                        <IconCheckCircle
                          size={13.5}
                          color={Colors.light.success}
                        />
                      )}
                      <Text
                        style={
                          lab.aktif ? styles.deactivateText : styles.activateText
                        }
                      >
                        {togglingId === lab.idLab
                          ? 'Memproses...'
                          : lab.aktif
                            ? 'Nonaktifkan'
                            : 'Aktifkan'}
                      </Text>
                    </PressableScale>
                  </View>
                </View>
              </EnterView>
            ))}
          </ScrollView>
        )}
      </View>

      <BottomSheet
        visible={sheetTerbuka}
        onTutup={tutupSheet}
        nonaktifTutup={menyimpan}
        denganKeyboard
        accessibilityLabelTutup="Tutup form laboratorium"
      >
        <View style={styles.sheetWrap}>
          <Text style={styles.heading}>
            {editId ? 'Edit Laboratorium' : 'Tambah Laboratorium'}
          </Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetBody}
            showsVerticalScrollIndicator={false}
          >
            {renderField('Kode laboratorium', 'kodeLab', false, 'Contoh: B')}
            {renderField(
              'Nama laboratorium',
              'nama',
              false,
              'Contoh: Lab Informatika B',
            )}
            {renderField(
              'Lokasi gedung',
              'lokasiGedung',
              false,
              'Contoh: Gedung E Lt. 2',
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Koordinat</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.pickButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => setPickerVisible(true)}
              >
                <IconMapPin size={16} color={Colors.light.primary} />
                <Text style={styles.pickButtonText}>Pilih Titik pada Peta</Text>
              </Pressable>
            </View>

            <View style={styles.coordInputsRow}>
              <View style={styles.coordInputCol}>
                {renderField('Latitude', 'latitude', true, '-7.0482')}
              </View>
              <View style={styles.coordInputCol}>
                {renderField('Longitude', 'longitude', true, '110.4407')}
              </View>
            </View>

            {renderField('Radius presensi (meter)', 'radiusPresensi', true, '40')}

            <Pressable
              style={styles.switchRow}
              onPress={() => setForm((old) => ({ ...old, aktif: !old.aktif }))}
            >
              <View
                style={[
                  styles.checkCircle,
                  form.aktif && styles.checkCircleActive,
                ]}
              >
                {form.aktif ? (
                  <IconCheck size={13} color="#FFFFFF" strokeWidth={2.5} />
                ) : null}
              </View>
              <Text style={styles.switchText}>
                Status laboratorium: {form.aktif ? 'Aktif' : 'Nonaktif'}
              </Text>
            </Pressable>
          </ScrollView>

          <View style={styles.sheetActions}>
            <View style={styles.actionFlex}>
              <AppButton
                title="Batal"
                variant="outline"
                fullWidth
                disabled={menyimpan}
                onPress={tutupSheet}
              />
            </View>
            <View style={styles.actionFlex}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  menyimpan && styles.disabled,
                  pressed && styles.pressed,
                ]}
                disabled={menyimpan}
                onPress={() => void simpan()}
              >
                {menyimpan ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryText}>
                    {editId ? 'Simpan' : 'Tambah Lab'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </BottomSheet>

      <ConfirmSheet
        visible={labDinonaktifkan !== null}
        judul="Nonaktifkan laboratorium?"
        pesan={
          labDinonaktifkan
            ? `${labDinonaktifkan.nama} tidak akan dapat dipilih untuk sesi baru, namun riwayat sesi lama tetap aman.`
            : ''
        }
        labelKonfirmasi="Nonaktifkan"
        labelLoading="Memproses…"
        loading={
          labDinonaktifkan !== null && togglingId === labDinonaktifkan.idLab
        }
        destructive
        onKonfirmasi={() => {
          if (labDinonaktifkan) {
            void jalankanToggleStatus(labDinonaktifkan, false);
          }
        }}
        onBatal={() => {
          if (!togglingId) setLabDinonaktifkan(null);
        }}
      />

      <LaboratoryPickerMap
        visible={pickerVisible}
        initialCoordinate={
          form.latitude && form.longitude
            ? {
                latitude: Number(form.latitude),
                longitude: Number(form.longitude),
              }
            : null
        }
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
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
    ...Shadows.subtle,
  },
  summaryText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
    color: Colors.light.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.primary,
    ...Shadows.primaryGlow,
  },
  addButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  emptyWrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: Radii.xl - 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeTile: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: Colors.light.brandMidSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.light.brandMid,
  },
  titleWrap: {
    flex: 1,
  },
  labName: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
    color: Colors.light.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  statusActive: {
    backgroundColor: Colors.light.successSoft,
  },
  statusInactive: {
    backgroundColor: Colors.light.warningSoft,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    maxWidth: '100%',
  },
  infoChipText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.light.textSecondary,
    flexShrink: 1,
  },
  coordPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.sm,
  },
  coordText: {
    fontFamily: Fonts.mono,
    fontSize: 11.5,
    color: Colors.light.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.sm,
    backgroundColor: Colors.light.backgroundElement,
  },
  editText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.text,
  },
  deactivatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.sm,
    backgroundColor: Colors.light.warningSoft,
  },
  deactivateText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.warning,
  },
  activatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.sm,
    backgroundColor: Colors.light.successSoft,
  },
  activateText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.light.success,
  },
  sheetWrap: {
    gap: 14,
  },
  heading: {
    fontFamily: Fonts.sansBold,
    fontSize: 19,
    color: Colors.light.text,
  },
  sheetBody: {
    gap: 12,
    paddingBottom: 6,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.light.text,
  },
  input: {
    minHeight: 46,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    paddingHorizontal: 13,
    backgroundColor: Colors.light.backgroundElement,
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    color: Colors.light.text,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primarySoft,
    padding: 12,
    borderRadius: Radii.md,
  },
  pickButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
    color: Colors.light.primary,
  },
  coordInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  coordInputCol: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  switchText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13.5,
    color: Colors.light.text,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionFlex: {
    flex: 1,
  },
  primaryBtn: {
    minHeight: 50,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    ...Shadows.primaryGlow,
  },
  primaryText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
