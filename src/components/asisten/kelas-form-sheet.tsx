import { ComponentRef, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import type { Kelas, Laboratorium } from '@/types';

const MAKS_NAMA = 80;
const GRACE_PERIOD_MAKS_MENIT = 120;
const NOMINAL_DENDA_MAKS_RUPIAH = 1_000_000;
const BATAS_AWAL_LAB = 4;

export type NilaiFormKelas = {
  namaPraktikum: string;
  labId: string;
  gracePeriodMenit: number;
  nominalDenda: number;
};

type KelasFormSheetProps = {
  visible: boolean;
  mode?: 'tambah' | 'ubah';
  kelasAwal?: Kelas | null;
  daftarLab?: Laboratorium[];
  loading?: boolean;
  errorPesan?: string | null;
  onSubmit: (nilai: NilaiFormKelas) => void;
  onTutup: () => void;
};

type FieldFokus = 'nama' | 'kelas' | 'tahun' | 'grace' | 'denda' | null;

function pecahNamaPraktikum(namaLengkap: string, tahunSekarang: number) {
  const match = /^(.+?)\s+([A-Za-z0-9]{2})\s*-\s*(\d{4})$/.exec(
    namaLengkap.trim(),
  );
  if (match) {
    return {
      nama: match[1].trim(),
      kelasHuruf: match[2].toUpperCase(),
      tahun: match[3],
    };
  }
  return {
    nama: namaLengkap.trim(),
    kelasHuruf: '',
    tahun: String(tahunSekarang),
  };
}

export function KelasFormSheet({
  visible,
  mode = 'tambah',
  kelasAwal = null,
  daftarLab = [],
  loading = false,
  errorPesan = null,
  onSubmit,
  onTutup,
}: KelasFormSheetProps) {
  const tahunSekarang = new Date().getFullYear();
  const awalTerpecah = pecahNamaPraktikum(
    kelasAwal?.namaPraktikum ?? '',
    tahunSekarang,
  );

  const [nama, setNama] = useState(awalTerpecah.nama);
  const [kelasHuruf, setKelasHuruf] = useState(awalTerpecah.kelasHuruf);
  const [tahunTeks, setTahunTeks] = useState(awalTerpecah.tahun);
  const [labId, setLabId] = useState<string>(kelasAwal?.labId ?? '');
  const [tampilkanSemuaLab, setTampilkanSemuaLab] = useState(false);
  const [graceTeks, setGraceTeks] = useState(
    String(kelasAwal?.gracePeriodMenit ?? 15),
  );
  const [dendaTeks, setDendaTeks] = useState(
    String(kelasAwal?.nominalDenda ?? 0),
  );
  const [errorLokal, setErrorLokal] = useState<string | null>(null);
  const [fieldFokus, setFieldFokus] = useState<FieldFokus>(null);

  const inputNamaRef = useRef<ComponentRef<typeof TextInput>>(null);
  const inputKelasRef = useRef<ComponentRef<typeof TextInput>>(null);
  const inputTahunRef = useRef<ComponentRef<typeof TextInput>>(null);
  const inputGraceRef = useRef<ComponentRef<typeof TextInput>>(null);
  const inputDendaRef = useRef<ComponentRef<typeof TextInput>>(null);

  const [prevVisible, setPrevVisible] = useState(visible);
  const [prevKelasAwal, setPrevKelasAwal] = useState(kelasAwal);

  if (visible !== prevVisible || kelasAwal !== prevKelasAwal) {
    setPrevVisible(visible);
    setPrevKelasAwal(kelasAwal);
    if (visible) {
      const parsed = pecahNamaPraktikum(
        kelasAwal?.namaPraktikum ?? '',
        tahunSekarang,
      );
      setNama(parsed.nama);
      setKelasHuruf(parsed.kelasHuruf);
      setTahunTeks(parsed.tahun);
      setLabId(kelasAwal?.labId ?? '');
      setTampilkanSemuaLab(false);
      setGraceTeks(String(kelasAwal?.gracePeriodMenit ?? 15));
      setDendaTeks(String(kelasAwal?.nominalDenda ?? 0));
      setErrorLokal(null);
      setFieldFokus(null);
    }
  }

  const namaBersih = nama.trim();
  const kelasBersih = kelasHuruf.trim().toUpperCase();
  const tahunAngka = Number(tahunTeks.trim());
  const namaGabungan = `${namaBersih} ${kelasBersih} - ${tahunAngka}`;

  const graceAngka = graceTeks.trim() === '' ? 0 : Number(graceTeks.trim());
  const dendaAngka = dendaTeks.trim() === '' ? 0 : Number(dendaTeks.trim());

  const tidakBerubah =
    mode === 'ubah' &&
    kelasAwal !== null &&
    namaGabungan === kelasAwal.namaPraktikum.trim() &&
    labId === (kelasAwal.labId ?? '') &&
    Number.isInteger(graceAngka) &&
    graceAngka === kelasAwal.gracePeriodMenit &&
    Number.isInteger(dendaAngka) &&
    dendaAngka === kelasAwal.nominalDenda;

  const tombolNonaktif = loading || tidakBerubah;
  const pesanError = errorLokal ?? errorPesan;

  const adaLabLebih = daftarLab.length > BATAS_AWAL_LAB;
  const labTerpilihDiluarBatas =
    !tampilkanSemuaLab &&
    adaLabLebih &&
    daftarLab.slice(BATAS_AWAL_LAB).some((item) => item.idLab === labId);

  const labDitampilkan =
    tampilkanSemuaLab || !adaLabLebih || labTerpilihDiluarBatas
      ? daftarLab
      : daftarLab.slice(0, BATAS_AWAL_LAB);

  const kirim = () => {
    if (loading) return;

    if (namaBersih.length === 0) {
      setErrorLokal('Nama praktikum wajib diisi.');
      return;
    }

    if (!/^[A-Z0-9]{2}$/.test(kelasBersih)) {
      setErrorLokal('Kode kelas harus 2 huruf (contoh: A1, A2, D2).');
      return;
    }

    if (!Number.isInteger(tahunAngka) || tahunAngka !== tahunSekarang) {
      setErrorLokal(`Tahun harus sama dengan tahun berjalan (${tahunSekarang}).`);
      return;
    }

    if (!labId) {
      setErrorLokal('Laboratorium wajib dipilih.');
      return;
    }

    if (
      !Number.isInteger(graceAngka) ||
      graceAngka < 0 ||
      graceAngka > GRACE_PERIOD_MAKS_MENIT
    ) {
      setErrorLokal(
        `Grace period harus antara 0 hingga ${GRACE_PERIOD_MAKS_MENIT} menit.`,
      );
      return;
    }

    if (
      !Number.isInteger(dendaAngka) ||
      dendaAngka < 0 ||
      dendaAngka > NOMINAL_DENDA_MAKS_RUPIAH
    ) {
      setErrorLokal(
        `Nominal denda harus antara Rp0 hingga Rp${NOMINAL_DENDA_MAKS_RUPIAH.toLocaleString('id-ID')}.`,
      );
      return;
    }

    if (tidakBerubah) return;

    setErrorLokal(null);
    onSubmit({
      namaPraktikum: namaGabungan,
      labId,
      gracePeriodMenit: graceAngka,
      nominalDenda: dendaAngka,
    });
  };

  const judul = mode === 'tambah' ? 'Tambah Praktikum' : 'Ubah kelas';
  const labelSimpan = mode === 'tambah' ? 'Simpan kelas' : 'Simpan perubahan';

  return (
    <BottomSheet
      visible={visible}
      onTutup={onTutup}
      nonaktifTutup={loading}
      denganKeyboard
      onSetelahTampil={() => {
        if (mode === 'tambah') {
          inputNamaRef.current?.focus();
        }
      }}
      accessibilityLabelTutup="Tutup form kelas"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.judul} accessibilityRole="header">
          {judul}
        </Text>

        <Text style={styles.label}>Nama praktikum</Text>
        <TextInput
          ref={inputNamaRef}
          value={nama}
          onChangeText={(teks) => {
            setNama(teks);
            if (errorLokal) setErrorLokal(null);
          }}
          onFocus={() => setFieldFokus('nama')}
          onBlur={() => setFieldFokus(null)}
          onSubmitEditing={() => inputKelasRef.current?.focus()}
          editable={!loading}
          maxLength={MAKS_NAMA}
          placeholder="Contoh: Basis Data"
          placeholderTextColor={Colors.light.textSecondary}
          returnKeyType="next"
          autoCapitalize="words"
          accessibilityLabel="Nama praktikum"
          style={[
            styles.input,
            fieldFokus === 'nama' && styles.inputFokus,
            loading && styles.inputNonaktif,
          ]}
        />

        <View style={styles.barisGanda}>
          <View style={styles.kolom}>
            <Text style={styles.label}>Kelas (2 huruf)</Text>
            <TextInput
              ref={inputKelasRef}
              value={kelasHuruf}
              onChangeText={(teks) => {
                const bersih = teks.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 2);
                setKelasHuruf(bersih);
                if (errorLokal) setErrorLokal(null);
              }}
              onFocus={() => setFieldFokus('kelas')}
              onBlur={() => setFieldFokus(null)}
              onSubmitEditing={() => inputTahunRef.current?.focus()}
              editable={!loading}
              maxLength={2}
              placeholder="A1"
              placeholderTextColor={Colors.light.textSecondary}
              returnKeyType="next"
              autoCapitalize="characters"
              accessibilityLabel="Kode kelas 2 huruf"
              style={[
                styles.input,
                fieldFokus === 'kelas' && styles.inputFokus,
                loading && styles.inputNonaktif,
              ]}
            />
          </View>

          <View style={styles.kolom}>
            <Text style={styles.label}>Tahun</Text>
            <TextInput
              ref={inputTahunRef}
              value={tahunTeks}
              onChangeText={(teks) => {
                setTahunTeks(teks.replace(/[^0-9]/g, '').slice(0, 4));
                if (errorLokal) setErrorLokal(null);
              }}
              onFocus={() => setFieldFokus('tahun')}
              onBlur={() => setFieldFokus(null)}
              onSubmitEditing={() => inputGraceRef.current?.focus()}
              editable={!loading}
              keyboardType="number-pad"
              maxLength={4}
              placeholder={String(tahunSekarang)}
              placeholderTextColor={Colors.light.textSecondary}
              returnKeyType="next"
              accessibilityLabel="Tahun kelas"
              style={[
                styles.input,
                fieldFokus === 'tahun' && styles.inputFokus,
                loading && styles.inputNonaktif,
              ]}
            />
          </View>
        </View>

        <View style={styles.headerLab}>
          <Text style={styles.label}>Laboratorium (wajib)</Text>
          {adaLabLebih ? (
            <Pressable
              onPress={() => setTampilkanSemuaLab((prev) => !prev)}
              disabled={loading}
              hitSlop={6}
            >
              <Text style={styles.linkToggleLab}>
                {tampilkanSemuaLab || labTerpilihDiluarBatas
                  ? 'Ringkas (4)'
                  : `Semua (${daftarLab.length})`}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {daftarLab.length === 0 ? (
          <Text style={styles.kosongLab}>
            Belum ada laboratorium aktif. Tambahkan laboratorium terlebih dahulu.
          </Text>
        ) : (
          <View style={styles.labListVertikal}>
            {labDitampilkan.map((lab) => {
              const terpilih = labId === lab.idLab;
              return (
                <Pressable
                  key={lab.idLab}
                  onPress={() => {
                    if (!loading) {
                      setLabId(lab.idLab);
                      if (errorLokal) setErrorLokal(null);
                    }
                  }}
                  disabled={loading}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: terpilih, disabled: loading }}
                  style={[
                    styles.labOpsi,
                    terpilih && styles.labOpsiAktif,
                    loading && styles.disabled,
                  ]}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      terpilih && styles.radioOuterAktif,
                    ]}
                  >
                    {terpilih ? <View style={styles.radioInner} /> : null}
                  </View>

                  <View style={styles.labInfo}>
                    <Text
                      style={[
                        styles.labNama,
                        terpilih && styles.labNamaAktif,
                      ]}
                      numberOfLines={1}
                    >
                      {lab.nama}
                    </Text>
                    <Text
                      style={[
                        styles.labMeta,
                        terpilih && styles.labMetaAktif,
                      ]}
                      numberOfLines={1}
                    >
                      {lab.lokasiGedung}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.barisGanda}>
          <View style={styles.kolom}>
            <Text style={styles.label}>Toleransi (menit)</Text>
            <TextInput
              ref={inputGraceRef}
              value={graceTeks}
              onChangeText={(teks) => {
                setGraceTeks(teks.replace(/[^0-9]/g, ''));
                if (errorLokal) setErrorLokal(null);
              }}
              onFocus={() => setFieldFokus('grace')}
              onBlur={() => setFieldFokus(null)}
              onSubmitEditing={() => inputDendaRef.current?.focus()}
              editable={!loading}
              keyboardType="number-pad"
              maxLength={3}
              placeholder="15"
              placeholderTextColor={Colors.light.textSecondary}
              returnKeyType="next"
              accessibilityLabel="Toleransi keterlambatan dalam menit"
              style={[
                styles.input,
                fieldFokus === 'grace' && styles.inputFokus,
                loading && styles.inputNonaktif,
              ]}
            />
            <Text style={styles.bantuan}>0–{GRACE_PERIOD_MAKS_MENIT} menit</Text>
          </View>

          <View style={styles.kolom}>
            <Text style={styles.label}>Denda tetap (Rp)</Text>
            <TextInput
              ref={inputDendaRef}
              value={dendaTeks}
              onChangeText={(teks) => {
                setDendaTeks(teks.replace(/[^0-9]/g, ''));
                if (errorLokal) setErrorLokal(null);
              }}
              onFocus={() => setFieldFokus('denda')}
              onBlur={() => setFieldFokus(null)}
              onSubmitEditing={kirim}
              editable={!loading}
              keyboardType="number-pad"
              maxLength={7}
              placeholder="5000"
              placeholderTextColor={Colors.light.textSecondary}
              returnKeyType="done"
              accessibilityLabel="Nominal denda tetap dalam Rupiah"
              style={[
                styles.input,
                fieldFokus === 'denda' && styles.inputFokus,
                loading && styles.inputNonaktif,
              ]}
            />
            <Text style={styles.bantuan}>0 jika tanpa denda</Text>
          </View>
        </View>

        {pesanError ? (
          <Text
            style={styles.error}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {pesanError}
          </Text>
        ) : null}

        <View style={styles.baris}>
          <Pressable
            onPress={onTutup}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Batal"
            accessibilityState={{ disabled: loading }}
            style={({ pressed }) => [
              styles.tombol,
              styles.tombolSekunder,
              pressed && !loading && styles.ditekan,
              loading && styles.disabled,
            ]}
          >
            <Text style={styles.tombolSekunderTeks}>Batal</Text>
          </Pressable>
          <Pressable
            onPress={kirim}
            disabled={tombolNonaktif}
            accessibilityRole="button"
            accessibilityLabel={loading ? 'Sedang menyimpan' : labelSimpan}
            accessibilityState={{ disabled: tombolNonaktif, busy: loading }}
            style={({ pressed }) => [
              styles.tombol,
              styles.tombolUtama,
              !tombolNonaktif && Shadows.primaryGlow,
              pressed && !tombolNonaktif && styles.ditekan,
              tombolNonaktif && styles.disabled,
            ]}
          >
            <Text style={styles.tombolUtamaTeks}>
              {loading ? 'Menyimpan…' : labelSimpan}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 8,
  },
  judul: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    color: Colors.light.text,
    marginBottom: 14,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
    color: Colors.light.text,
    marginBottom: 6,
  },
  barisGanda: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  kolom: {
    flex: 1,
  },
  previewTeks: {
    marginTop: 8,
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  previewBold: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.light.text,
  },
  headerLab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  linkToggleLab: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
    color: Colors.light.primary,
    marginBottom: 6,
  },
  kosongLab: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.light.textSecondary,
    paddingVertical: 8,
  },
  labListVertikal: {
    gap: 8,
  },
  labOpsi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundElement,
  },
  labOpsiAktif: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.light.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterAktif: {
    borderColor: '#FFFFFF',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  labInfo: {
    flex: 1,
    gap: 1,
  },
  labNama: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13.5,
    color: Colors.light.text,
  },
  labNamaAktif: {
    color: '#FFFFFF',
  },
  labMeta: {
    fontFamily: Fonts.sans,
    fontSize: 11.5,
    color: Colors.light.textSecondary,
  },
  labMetaAktif: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  bantuan: {
    marginTop: 4,
    fontFamily: Fonts.sans,
    fontSize: 11.5,
    color: Colors.light.textSecondary,
  },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundElement,
  },
  inputFokus: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.card,
  },
  inputNonaktif: {
    opacity: 0.65,
    color: Colors.light.textSecondary,
  },
  error: {
    marginTop: 10,
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.light.danger,
  },
  baris: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  tombol: {
    flex: 1,
    minHeight: 50,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  tombolSekunder: {
    backgroundColor: Colors.light.backgroundElement,
  },
  tombolUtama: {
    backgroundColor: Colors.light.primary,
  },
  ditekan: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.55,
  },
  tombolSekunderTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14.5,
    color: Colors.light.text,
  },
  tombolUtamaTeks: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
});