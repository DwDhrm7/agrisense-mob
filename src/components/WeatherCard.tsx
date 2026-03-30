// ──────────────────────────────────────────────
// AgriSense · WeatherCard — Premium Edition
// ──────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, OPENMETEO_CONFIG } from '../utils/config';
import type { WeatherData } from '../services/WeatherService';

interface WeatherCardProps {
  weather: WeatherData | null;
  loading?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, loading }) => {
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  loadingText: {
    color: COLORS.textLight,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tempText: {
    fontSize: 48,
    fontFamily: 'Inter-Regular',
    color: COLORS.textPrimary,
    letterSpacing: -3,
    lineHeight: 52,
  },
  descText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  locationTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
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
    width: 1,
    height: 28,
    backgroundColor: COLORS.borderLight,
  },
  detailValue: {
    fontSize: 17,
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Regular',
    letterSpacing: -0.5,
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  insightBanner: {
    marginTop: 18,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary,
  },
  insightText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
});

export default WeatherCard;
