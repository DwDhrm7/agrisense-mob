// ──────────────────────────────────────────────
// AgriSense · SensorCard — Premium Edition
// ──────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SENSOR_THRESHOLDS } from '../utils/config';
import { useTheme } from '../utils/theme';

interface SensorCardProps {
  label: string;
  subtitle?: string;
  value: string;
  unit: string;
  color: string;
  sensorKey?: keyof typeof SENSOR_THRESHOLDS;
  trend?: 'Naik' | 'Turun' | 'Stabil' | null;
}

const SensorCard: React.FC<SensorCardProps> = ({ label, subtitle, value, unit, color, sensorKey, trend }) => {
  const COLORS = useTheme();
  const styles = typeof getStyles !== "undefined" ? getStyles(COLORS) : {} as any;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value && value !== '–') {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 120, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
    prevValue.current = value;
  }, [value, pulseAnim]);

  const getStatus = () => {
    if (!sensorKey || value === '–') return 'normal';
    const v = parseFloat(value);
    const t = SENSOR_THRESHOLDS[sensorKey];
    if (!t || isNaN(v)) return 'normal';
    if (v < t.min || v > t.max) return 'danger';
    const range = t.max - t.min;
    if (v < t.min + range * 0.15 || v > t.max - range * 0.15) return 'warning';
    return 'normal';
  };

  const status = getStatus();

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
      {/* Accent line */}
      <View style={[styles.accentLine, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {trend && trend !== 'Stabil' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 10, color: trend === 'Naik' ? COLORS.error : COLORS.success, fontFamily: 'Inter-Bold' }}>
            {trend === 'Naik' ? '↑ Naik' : '↓ Turun'}
          </Text>
        </View>
      )}
      {status !== 'normal' && (
        <View style={[styles.statusBar, status === 'danger' ? styles.statusDanger : styles.statusWarning]}>
          <Text style={[styles.statusText, status === 'danger' ? styles.dangerText : styles.warningText]}>
            {status === 'danger' ? 'Di luar batas' : 'Mendekati batas'}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 4,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 6,
    bottom: 0,
    opacity: 0.8,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textLight,
    fontSize: 9,
    fontFamily: 'Inter-Medium',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 36,
    fontFamily: 'Outfit-Bold',
    color: COLORS.textPrimary,
    letterSpacing: -1.5,
  },
  unit: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    marginLeft: 4,
  },
  statusBar: {
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
  },
  statusDanger: {
    backgroundColor: COLORS.errorSoft,
    borderColor: COLORS.error,
  },
  statusWarning: {
    backgroundColor: COLORS.warningSoft,
    borderColor: COLORS.warning,
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dangerText: {
    color: COLORS.error,
  },
  warningText: {
    color: COLORS.warning,
  },
});

export default SensorCard;
