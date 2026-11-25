import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
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

function formatInputTanggalWaktu(tanggal: Date): string {
  const tahun = tanggal.getFullYear();
  const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
  const hari = String(tanggal.getDate()).padStart(2, '0');
  const jam = String(tanggal.getHours()).padStart(2, '0');
  const menit = String(tanggal.getMinutes()).padStart(2, '0');
  return `${tahun}-${bulan}-${hari} ${jam}:${menit}`;
}

function parseInputTanggalWaktu(teks: string): Date | null {
  const rapi = teks.trim();
  if (!rapi) return null;

  const cocok = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(rapi);
  if (!cocok) return null;

  const tahun = Number(cocok[1]);
  const bulan = Number(cocok[2]);
  const hari = Number(cocok[3]);
  const jam = Number(cocok[4]);
  const menit = Number(cocok[5]);

  const hasil = new Date(tahun, bulan - 1, hari, jam, menit, 0, 0);
  if (
    Number.isNaN(hasil.getTime()) ||
    hasil.getFullYear() !== tahun ||
    hasil.getMonth() !== bulan - 1 ||
    hasil.getDate() !== hari ||
    hasil.getHours() !== jam ||
    hasil.getMinutes() !== menit
  ) {
    return null;
  }

  return hasil;
}

function SesiFormSheetIsi({
  mode,
  sesiAwal,
  loading,
  errorPesan,
  onSubmit,
  onTutup,
}: Omit<SesiFormSheetProps, 'visible'>) {
  const waktuMulaiAwalTeks = useMemo(() => {
    if (mode === 'ubah' && sesiAwal) {
      return formatInputTanggalWaktu(sesiAwal.waktuMulai);
    }
    const sekarang = new Date();
    sekarang.setSeconds(0, 0);
    return formatInputTanggalWaktu(sekarang);
  }, [mode, sesiAwal]);

  const waktuSelesaiAwalTeks = useMemo(
    () =>
      mode === 'ubah' && sesiAwal?.waktuSelesai
        ? formatInputTanggalWaktu(sesiAwal.waktuSelesai)
        : '',
    [mode, sesiAwal],
  );

  const [judul, setJudul] = useState(() =>
    mode === 'ubah' && sesiAwal ? sesiAwal.judul : '',
  );
  const [labId, setLabId] = useState(() =>
    mode === 'ubah' && sesiAwal?.labId ? sesiAwal.labId : '',
  );
  const { daftarLaboratorium, loading: loadingLab, error: errorLab } =
    useLaboratorium();
  const labAktif = daftarLaboratorium.filter((lab) => lab.aktif);
  const [waktuMulaiTeks, setWaktuMulaiTeks] = useState(waktuMulaiAwalTeks);
  const [waktuSelesaiTeks, setWaktuSelesaiTeks] = useState(waktuSelesaiAwalTeks);
  const [errorLokal, setErrorLokal] = useState<string | null>(null);

  const adaPerubahan = useMemo(() => {
    if (mode !== 'ubah' || !sesiAwal) {
      return true;
    }

    const waktuMulaiNorm = waktuMulaiTeks.trim().replace('T', ' ');
    const waktuSelesaiNorm = waktuSelesaiTeks.trim().replace('T', ' ');

    return (
      judul.trim() !== sesiAwal.judul.trim() ||
      labId !== (sesiAwal.labId ?? '') ||
      waktuMulaiNorm !== waktuMulaiAwalTeks ||
      waktuSelesaiNorm !== waktuSelesaiAwalTeks
    );
  }, [
    mode,
    sesiAwal,
    judul,
    labId,
    waktuMulaiTeks,
    waktuSelesaiTeks,
    waktuMulaiAwalTeks,
    waktuSelesaiAwalTeks,
  ]);

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

    const waktuMulai = parseInputTanggalWaktu(waktuMulaiTeks);
    if (!waktuMulai) {
      setErrorLokal(
        'Format waktu mulai harus YYYY-MM-DD HH:mm (contoh: 2026-11-14 13:00).',
      );
      return;
    }

    let waktuSelesai: Date | null = null;
    if (waktuSelesaiTeks.trim().length > 0) {
      waktuSelesai = parseInputTanggalWaktu(waktuSelesaiTeks);
      if (!waktuSelesai) {
        setErrorLokal(
          'Format waktu selesai harus YYYY-MM-DD HH:mm atau kosongkan.',
        );
        return;
      }
      if (waktuSelesai.getTime() <= waktuMulai.getTime()) {
        setErrorLokal('Waktu selesai harus lebih besar dari waktu mulai.');
        return;
      }
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
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === 'tambah' ? 'Tambah Sesi Baru' : 'Ubah Sesi'}
      </Text>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.formBody}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={styles.label}>Judul Sesi</Text>
          <TextInput
            value={judul}
            onChangeText={setJudul}
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

        <View style={styles.field}>
          <Text style={styles.label}>Waktu Mulai (YYYY-MM-DD HH:mm)</Text>
          <TextInput
            value={waktuMulaiTeks}
            onChangeText={setWaktuMulaiTeks}
            placeholder="2026-11-14 13:00"
            placeholderTextColor={Colors.light.textSecondary}
            editable={!loading}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Waktu Selesai (Opsional, YYYY-MM-DD HH:mm)
          </Text>
          <TextInput
            value={waktuSelesaiTeks}
            onChangeText={setWaktuSelesaiTeks}
            placeholder="Kosongkan jika belum ditentukan"
            placeholderTextColor={Colors.light.textSecondary}
            editable={!loading}
            style={styles.input}
          />
        </View>

        {pesanError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{pesanError}</Text>
          </View>
        ) : null}
      </ScrollView>

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
    </View>
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
    <BottomSheet
      visible={visible}
      onTutup={() => {
        if (!loading) onTutup();
      }}
      nonaktifTutup={loading}
      denganKeyboard
      accessibilityLabelTutup="Tutup form sesi"
    >
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
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 19,
    color: Colors.light.text,
  },
  formBody: {
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
