// ──────────────────────────────────────────────
// AgriSense · WeatherCard — Premium Edition
// ──────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OPENMETEO_CONFIG } from '../utils/config';
import { useTheme } from '../utils/theme';
import type { WeatherData } from '../services/WeatherService';

interface WeatherCardProps {
  weather: WeatherData | null;
  loading?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, loading }) => {
  const COLORS = useTheme();
  const styles = typeof getStyles !== "undefined" ? getStyles(COLORS) : {} as any;

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Memuat data cuaca...</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Data cuaca tidak tersedia</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main weather */}
      <View style={styles.mainRow}>
        <View>
          <Text style={styles.tempText}>{weather.temperature}°</Text>
          <Text style={styles.descText}>{weather.description}</Text>
        </View>
        <View style={styles.locationTag}>
          <Text style={styles.locationText}>{OPENMETEO_CONFIG.city}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Detail grid */}
      <View style={styles.detailGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{weather.feelsLike}°</Text>
          <Text style={styles.detailLabel}>Terasa</Text>
        </View>
        <View style={styles.detailSeparator} />
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{weather.humidity}%</Text>
          <Text style={styles.detailLabel}>Kelembapan</Text>
        </View>
        <View style={styles.detailSeparator} />
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{weather.windSpeed}</Text>
          <Text style={styles.detailLabel}>Angin km/h</Text>
        </View>
        <View style={styles.detailSeparator} />
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{weather.uvIndex}</Text>
          <Text style={styles.detailLabel}>UV Index</Text>
        </View>
      </View>

      {/* Precipitation insight */}
      {weather.precipitation > 0 && (
        <View style={styles.insightBanner}>
          <Text style={styles.insightText}>
            Curah hujan terdeteksi ({weather.precipitation} mm) — pertimbangkan pengurangan irigasi.
          </Text>
        </View>
      )}
    </View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 28,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 4,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
    fontFamily: 'Inter-Medium',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempText: {
    fontSize: 60,
    fontFamily: 'Outfit-Bold',
    color: COLORS.textPrimary,
    letterSpacing: -2.5,
  },
  descText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Bold',
    marginTop: -8,
  },
  locationTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  locationText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.borderLight,
    marginVertical: 24,
    opacity: 0.5,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailSeparator: {
    width: 1.5,
    height: 28,
    backgroundColor: COLORS.borderLight,
  },
  detailValue: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontFamily: 'Outfit-Bold',
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 8,
  },
  insightBanner: {
    marginTop: 24,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  insightText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default WeatherCard;
