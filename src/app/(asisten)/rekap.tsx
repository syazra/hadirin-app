import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RekapItem } from '@/components/asisten/rekap-item';
import { RingkasanHadir } from '@/components/asisten/ringkasan-hadir';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useJadwalAsisten } from '@/hooks/use-jadwal-asisten';
import { useKelasAsisten } from '@/hooks/use-kelas-asisten';
import { useRekapSesi } from '@/hooks/use-rekap-sesi';
import { formatWaktu } from '@/utils/format-waktu';

export default function RekapScreen() {
  const { pengguna } = useAuth();
  const {
    kelas,
    loading: loadingKelas,
    error: errorKelas,
  } = useKelasAsisten(pengguna?.uid ?? null);
  const {
    sesi,
    loading: loadingSesi,
    error: errorSesi,
  } = useJadwalAsisten(pengguna?.uid ?? null);

  const [idKelasPilihan, setIdKelasPilihan] = useState<string>('');
  const [idSesiPilihan, setIdSesiPilihan] = useState<string>('');

  const idKelasTerpilih = useMemo(() => {
    if (kelas.length === 0) return '';
    return kelas.some((item) => item.idKelas === idKelasPilihan)
      ? idKelasPilihan
      : kelas[0].idKelas;
  }, [kelas, idKelasPilihan]);

  const sesiKelas = useMemo(
    () => sesi.filter((item) => item.kelasId === idKelasTerpilih),
    [sesi, idKelasTerpilih],
  );

  const idSesiTerpilih = useMemo(() => {
    if (sesiKelas.length === 0) return '';
    return sesiKelas.some((item) => item.idSesi === idSesiPilihan)
      ? idSesiPilihan
      : sesiKelas[0].idSesi;
  }, [sesiKelas, idSesiPilihan]);

  const kelasAktif = kelas.find((item) => item.idKelas === idKelasTerpilih);
  const sesiAktif = sesiKelas.find((item) => item.idSesi === idSesiTerpilih);

  const rekap = useRekapSesi(
    sesiAktif?.idSesi ?? null,
    sesiAktif?.kelasId ?? null,
  );

  if (loadingKelas || loadingSesi) {
    return <LoadingState pesan="Memuat daftar kelas dan sesi..." />;
  }

  if (errorKelas || errorSesi) {
    return (
      <ErrorState
        pesan={errorKelas ?? errorSesi ?? 'Gagal memuat data rekap.'}
      />
    );
  }

  if (kelas.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          judul="Belum ada kelas"
          pesan="Buat kelas terlebih dahulu untuk memantau rekap kehadiran."
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rekap Kehadiran</Text>
        <Text style={styles.subtitle}>
          Pantau daftar hadir, izin disetujui, dan status peserta secara realtime.
        </Text>
      </View>

      <Text style={styles.label}>Pilih Kelas</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {kelas.map((item) => {
          const aktif = item.idKelas === idKelasTerpilih;
          return (
            <Pressable
              key={item.idKelas}
              style={[styles.chip, aktif && styles.chipAktif]}
              onPress={() => setIdKelasPilihan(item.idKelas)}
            >
              <Text style={[styles.chipText, aktif && styles.chipTextAktif]}>
                {item.namaPraktikum}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>Pilih Sesi Praktikum</Text>
      {sesiKelas.length === 0 ? (
        <EmptyState
          judul="Belum ada sesi"
          pesan="Kelas ini belum memiliki sesi praktikum."
        />
      ) : (
        <View style={styles.pilihanSesi}>
          {sesiKelas.map((item) => {
            const aktif = item.idSesi === idSesiTerpilih;
            return (
              <Pressable
                key={item.idSesi}
                style={[styles.pilihan, aktif && styles.pilihanAktif]}
                onPress={() => setIdSesiPilihan(item.idSesi)}
              >
                <View style={styles.pilihanHeader}>
                  <Text
                    style={[styles.namaPilihan, aktif && styles.namaPilihanAktif]}
                  >
                    {item.judul}
                  </Text>
                  <StatusBadge status={item.statusSesi} />
                </View>
                <Text style={styles.waktuSesi}>
                  {item.lokasi} · {formatWaktu(item.waktuMulai.toISOString())}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {sesiAktif && (
        <>
          <View style={styles.ringkasanHeader}>
            <Text style={styles.namaSesi}>{sesiAktif.judul}</Text>
            <Text style={styles.lokasi}>
              {kelasAktif?.namaPraktikum} · {sesiAktif.lokasi}
            </Text>
          </View>

          {rekap.loading ? (
            <LoadingState pesan="Memuat rekap sesi..." />
          ) : rekap.error ? (
            <ErrorState pesan={rekap.error} />
          ) : (
            <>
              <RingkasanHadir
                jumlahHadir={rekap.jumlahHadir}
                jumlahIzin={rekap.jumlahIzin}
                jumlahBelumHadir={rekap.jumlahBelumHadir}
                jumlahIzinMenunggu={rekap.jumlahIzinMenunggu}
              />

              {rekap.totalPeserta === 0 ? (
                <EmptyState
                  judul="Belum ada peserta"
                  pesan="Belum ada peserta atau catatan presensi/izin pada sesi ini."
                />
              ) : (
                <View style={styles.sections}>
                  <View style={styles.section}>
                    <Text style={styles.label}>
                      Hadir ({rekap.daftarHadir.length})
                    </Text>
                    {rekap.daftarHadir.length > 0 ? (
                      <View style={styles.daftar}>
                        {rekap.daftarHadir.map((item) => (
                          <RekapItem key={item.uid} {...item} />
                        ))}
                      </View>
                    ) : (
                      <EmptyState
                        judul="Belum ada yang hadir"
                        pesan="Belum ada praktikan yang tercatat hadir."
                      />
                    )}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>
                      Izin Disetujui ({rekap.daftarIzinDisetujui.length})
                    </Text>
                    {rekap.daftarIzinDisetujui.length > 0 ? (
                      <View style={styles.daftar}>
                        {rekap.daftarIzinDisetujui.map((item) => (
                          <RekapItem key={item.uid} {...item} />
                        ))}
                      </View>
                    ) : (
                      <EmptyState
                        judul="Tidak ada izin disetujui"
                        pesan="Belum ada pengajuan izin yang disetujui pada sesi ini."
                      />
                    )}
                  </View>

                  {rekap.daftarIzinLainnya.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.label}>
                        Pengajuan Izin Menunggu / Ditolak (
                        {rekap.daftarIzinLainnya.length})
                      </Text>
                      <View style={styles.daftar}>
                        {rekap.daftarIzinLainnya.map((item) => (
                          <RekapItem key={item.uid} {...item} />
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.section}>
                    <Text style={styles.label}>
                      Belum Hadir ({rekap.daftarBelumHadir.length})
                    </Text>
                    {rekap.daftarBelumHadir.length > 0 ? (
                      <View style={styles.daftar}>
                        {rekap.daftarBelumHadir.map((item) => (
                          <RekapItem key={item.uid} {...item} />
                        ))}
                      </View>
                    ) : (
                      <EmptyState
                        judul="Semua peserta tercatat"
                        pesan="Seluruh peserta sudah hadir atau memiliki izin disetujui."
                      />
                    )}
                  </View>
                </View>
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  container: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: 32,
  },
  header: { gap: Spacing.two },
  title: { fontSize: 24, fontWeight: '700', color: Colors.light.text },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.textSecondary,
  },
  label: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  chipAktif: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
  chipTextAktif: { color: Colors.light.primary },
  pilihanSesi: { gap: 10 },
  pilihan: {
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    gap: 6,
  },
  pilihanAktif: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
  },
  pilihanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  namaPilihan: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  namaPilihanAktif: { color: Colors.light.primary },
  waktuSesi: { fontSize: 12, color: Colors.light.textSecondary },
  ringkasanHeader: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    gap: 5,
  },
  namaSesi: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.backgroundElement,
  },
  lokasi: { fontSize: 13, color: Colors.light.backgroundElement },
  sections: { gap: Spacing.four },
  section: { gap: 10 },
  daftar: { gap: 10 },
});