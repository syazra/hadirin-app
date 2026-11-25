import { StyleSheet, Text, View } from 'react-native';

import { BrandGradient } from '@/components/ui/brand-gradient';
import { IconClock, IconMapPin } from '@/components/ui/icons';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import type { Sesi } from '@/types';

type DetailSesiProps = {
  sesi: Sesi;
  namaPraktikum?: string;
};

function formatJam(tanggal: Date): string {
  const jam = String(tanggal.getHours()).padStart(2, '0');
  const menit = String(tanggal.getMinutes()).padStart(2, '0');
  return `${jam}.${menit}`;
}

function formatRentangWaktu(waktuMulai: Date, waktuSelesai: Date | null): string {
  const tanggal = waktuMulai.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const jamMulai = formatJam(waktuMulai);
  if (!waktuSelesai) {
    return `${tanggal} · ${jamMulai} WIB`;
  }

  return `${tanggal} · ${jamMulai}–${formatJam(waktuSelesai)} WIB`;
}

export function DetailSesi({ sesi, namaPraktikum }: DetailSesiProps) {
  const waktuTampil = formatRentangWaktu(sesi.waktuMulai, sesi.waktuSelesai);
  const sedangDibuka = sesi.statusSesi === 'DIBUKA' && !sesi.diarsipkan;

  if (sedangDibuka) {
    return (
      <BrandGradient variant="indigo" style={[styles.heroCard, Shadows.primaryGlow]}>
        <View style={styles.topRow}>
          {namaPraktikum ? (
            <View style={styles.frostedClassPill}>
              <Text style={styles.frostedClassText} numberOfLines={1}>
                {namaPraktikum}
              </Text>
            </View>
          ) : (
            <View />
          )}

          <View style={styles.frostedLivePill}>
            <View style={styles.liveDot} />
            <Text style={styles.frostedLiveText}>Dibuka</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>{sesi.judul}</Text>

        <View style={styles.heroPills}>
          <View style={styles.frostedInfoPill}>
            <IconMapPin size={14} color="#FFFFFF" />
            <Text style={styles.frostedInfoText}>{sesi.lokasi}</Text>
          </View>
          <View style={styles.frostedInfoPill}>
            <IconClock size={14} color="#FFFFFF" />
            <Text style={styles.frostedInfoText}>{waktuTampil}</Text>
          </View>
        </View>
      </BrandGradient>
    );
  }

  return (
    <View style={styles.card}>
      <BrandGradient variant="warm" decorative={false} style={styles.warmBand}>
        <View style={styles.topRow}>
          {namaPraktikum ? (
            <Text style={styles.kelas} numberOfLines={1}>
              {namaPraktikum}
            </Text>
          ) : (
            <View />
          )}

          <View style={styles.badgeRow}>
            <StatusBadge status={sesi.statusSesi} />
            {sesi.diarsipkan ? (
              <View style={styles.arsipBadge}>
                <Text style={styles.arsipBadgeText}>Arsip</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.nama}>{sesi.judul}</Text>
      </BrandGradient>

      <View style={styles.pillsBody}>
        <View style={styles.infoPill}>
          <IconMapPin size={15} color={Colors.light.teal} />
          <Text style={styles.infoPillText}>{sesi.lokasi}</Text>
        </View>
        <View style={styles.infoPill}>
          <IconClock size={15} color={Colors.light.warm} />
          <Text style={styles.infoPillText}>{waktuTampil}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: Radii.xl,
    padding: 20,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  frostedClassPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    maxWidth: '65%',
  },
  frostedClassText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  frostedLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#73F2B3',
  },
  frostedLiveText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  heroTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 21,
    lineHeight: 27,
    color: '#FFFFFF',
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frostedInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radii.md,
  },
  frostedInfoText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  card: {
    borderRadius: Radii.xl,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    ...Shadows.card,
  },
  warmBand: {
    padding: 18,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  kelas: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
    color: Colors.light.primary,
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arsipBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  arsipBadgeText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11.5,
    color: Colors.light.textSecondary,
  },
  nama: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    lineHeight: 26,
    color: Colors.light.text,
  },
  pillsBody: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  infoPillText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.light.text,
  },
});
