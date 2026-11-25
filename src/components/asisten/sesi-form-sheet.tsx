import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SesiWaktuPicker } from '@/components/asisten/sesi-waktu-picker';
import { IconCheck } from '@/components/ui/icons';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useLaboratorium } from '@/hooks/use-laboratorium';
import type { Sesi } from '@/types';

export type NilaiFormSesi = {
  judul: string;
  labId: string;
  waktuMulai: Date;
  waktuSelesai: Date | null;
};

export interface SesiFormSheetProps {
  visible: boolean;
  mode: 'tambah' | 'ubah';
  sesiAwal?: Sesi | null;
  loading: boolean;
  errorPesan: string | null;
  onSubmit: (nilai: NilaiFormSesi) => void;
  onTutup: () => void;
}

function SesiFormSheetIsi({
  mode,
  sesiAwal,
  loading,
  errorPesan,
  onSubmit,
  onTutup,
}: Omit<SesiFormSheetProps, 'visible'>) {
  const sesiAwalUbah = mode === 'ubah' ? sesiAwal : null;
  const [judul, setJudul] = useState(() => sesiAwalUbah?.judul ?? '');
  const [labId, setLabId] = useState(() => sesiAwalUbah?.labId ?? '');
  const [waktuMulai, setWaktuMulai] = useState(() => {
    if (sesiAwalUbah) return sesiAwalUbah.waktuMulai;
    const sekarang = new Date();
    sekarang.setSeconds(0, 0);
    return sekarang;
  });
  const [waktuSelesai, setWaktuSelesai] = useState<Date | null>(
    () => sesiAwalUbah?.waktuSelesai ?? null,
  );
  const [errorLokal, setErrorLokal] = useState<string | null>(null);
  const { daftarLaboratorium, loading: loadingLab, error: errorLab } =
    useLaboratorium();
  const labAktif = daftarLaboratorium.filter((lab) => lab.aktif);

  const adaPerubahan =
    !sesiAwalUbah ||
    judul.trim() !== sesiAwalUbah.judul.trim() ||
    labId !== (sesiAwalUbah.labId ?? '') ||
    waktuMulai.getTime() !== sesiAwalUbah.waktuMulai.getTime() ||
    waktuSelesai?.getTime() !== sesiAwalUbah.waktuSelesai?.getTime();

  const handleKirim = () => {
    if (loading || !adaPerubahan) return;

    const judulRapi = judul.trim();

    if (!judulRapi) {
      setErrorLokal('Judul sesi wajib diisi.');
      return;
    }
    if (judulRapi.length > 100) {
      setErrorLokal('Judul sesi maksimal 100 karakter.');
      return;
    }
    if (loadingLab) {
      setErrorLokal('Tunggu sampai daftar laboratorium selesai dimuat.');
      return;
    }

    if (!labAktif.some((lab) => lab.idLab === labId)) {
      setErrorLokal('Pilih laboratorium yang masih aktif.');
      return;
    }

    if (waktuSelesai && waktuSelesai.getTime() <= waktuMulai.getTime()) {
      setErrorLokal('Waktu selesai harus lebih besar dari waktu mulai.');
      return;
    }

    setErrorLokal(null);
    onSubmit({
      judul: judulRapi,
      labId,
      waktuMulai,
      waktuSelesai,
    });
  };

  const pesanError = errorLokal ?? errorPesan;
  const tombolSimpanNonaktif =
    loading || loadingLab || labAktif.length === 0 || !adaPerubahan;

  return (
    <ScrollView
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.formBody}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title} accessibilityRole="header">
        {mode === 'tambah' ? 'Tambah Sesi Baru' : 'Ubah Sesi'}
      </Text>

      <View style={styles.fields}>
        <View style={styles.field}>
          <Text style={styles.label}>Judul Sesi</Text>
          <TextInput
            value={judul}
            onChangeText={(teks) => {
              setJudul(teks);
              setErrorLokal(null);
            }}
            accessibilityLabel="Judul sesi"
            placeholder="Contoh: Pertemuan 3 — Modul Firestore"
            placeholderTextColor={Colors.light.textSecondary}
            maxLength={100}
            editable={!loading}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Laboratorium</Text>

          {loadingLab ? (
            <Text style={styles.labOptionText}>Memuat laboratorium...</Text>
          ) : errorLab ? (
            <Text style={styles.errorText}>{errorLab}</Text>
          ) : labAktif.length === 0 ? (
            <Text style={styles.errorText}>Belum ada laboratorium aktif.</Text>
          ) : (
            labAktif.map((lab) => {
              const selected = labId === lab.idLab;
              return (
                <Pressable
                  key={lab.idLab}
                  disabled={loading}
                  onPress={() => {
                    setLabId(lab.idLab);
                    setErrorLokal(null);
                  }}
                  style={[
                    styles.labOption,
                    selected && styles.labOptionSelected,
                    loading && styles.disabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected,
                    disabled: loading,
                  }}
                >
                  <Text
                    style={[
                      styles.labOptionText,
                      selected && styles.labOptionTextSelected,
                    ]}
                  >
                    {lab.nama} · {lab.lokasiGedung}
                  </Text>
                  {selected ? (
                    <IconCheck size={16} color={Colors.light.primary} strokeWidth={2.4} />
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>

        <SesiWaktuPicker
          label="Waktu Mulai"
          nilai={waktuMulai}
          nilaiAwal={waktuMulai}
          nonaktif={loading}
          onUbah={(waktu) => {
            setWaktuMulai(waktu);
            setErrorLokal(null);
          }}
        />

        <SesiWaktuPicker
          label="Waktu Selesai (Opsional)"
          nilai={waktuSelesai}
          nilaiAwal={new Date(waktuMulai.getTime() + 60 * 60 * 1000)}
          nonaktif={loading}
          onUbah={(waktu) => {
            setWaktuSelesai(waktu);
            setErrorLokal(null);
          }}
          onKosongkan={() => {
            setWaktuSelesai(null);
            setErrorLokal(null);
          }}
        />

        {pesanError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{pesanError}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          disabled={loading}
          onPress={onTutup}
          style={[
            styles.button,
            styles.cancelButton,
            loading && styles.disabled,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Batal</Text>
        </Pressable>

        <Pressable
          disabled={tombolSimpanNonaktif}
          onPress={handleKirim}
          style={[
            styles.button,
            styles.submitButton,
            !tombolSimpanNonaktif && Shadows.primaryGlow,
            tombolSimpanNonaktif && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: tombolSimpanNonaktif }}
        >
          <Text style={styles.submitText}>
            {loading
              ? 'Menyimpan…'
              : mode === 'tambah'
                ? 'Simpan Sesi'
                : 'Simpan Perubahan'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export function SesiFormSheet({
  visible,
  mode,
  sesiAwal = null,
  loading,
  errorPesan,
  onSubmit,
  onTutup,
}: SesiFormSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        if (!loading) onTutup();
      }}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <SafeAreaView style={styles.screen}>
          {visible ? (
            <SesiFormSheetIsi
              key={`${mode}-${sesiAwal?.idSesi ?? 'baru'}`}
              mode={mode}
              sesiAwal={sesiAwal}
              loading={loading}
              errorPesan={errorPesan}
              onSubmit={onSubmit}
              onTutup={onTutup}
            />
          ) : null}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.card,
  },
  formBody: {
    gap: 14,
    padding: 24,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 19,
    color: Colors.light.text,
  },
  fields: {
    gap: 13,
    paddingBottom: 8,
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
    minHeight: 48,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.light.text,
  },
  labOption: {
    minHeight: 46,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  labOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
  },
  labOptionText: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13.5,
    color: Colors.light.text,
  },
  labOptionTextSelected: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.light.primary,
  },
  errorBox: {
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#FAD0DC',
    backgroundColor: Colors.light.dangerSoft,
  },
  errorText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.light.danger,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  cancelButton: {
    backgroundColor: Colors.light.backgroundElement,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
  },
  cancelText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.light.text,
  },
  submitText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.55,
  },
});
