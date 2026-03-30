// ──────────────────────────────────────────────
// AgriSense · SensorCard — Premium Edition
// ──────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SENSOR_THRESHOLDS } from '../utils/config';

interface SensorCardProps {
  label: string;
  subtitle?: string;
  value: string;
  unit: string;
  color: string;
  sensorKey?: keyof typeof SENSOR_THRESHOLDS;
}

const SensorCard: React.FC<SensorCardProps> = ({ label, subtitle, value, unit, color, sensorKey }) => {
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

const styles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    paddingTop: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    borderRadius: 1,
    opacity: 0.5,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textLight,
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    marginBottom: 14,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  value: {
    fontSize: 30,
    fontFamily: 'Inter-Regular',
    letterSpacing: -1.5,
    lineHeight: 32,
  },
  unit: {
    color: COLORS.textLight,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  statusBar: {
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusDanger: {
    backgroundColor: COLORS.errorSoft,
  },
  statusWarning: {
    backgroundColor: COLORS.warningSoft,
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
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
