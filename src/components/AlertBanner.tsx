// ──────────────────────────────────────────────
// AgriSense · Alert Banner — Premium
// ──────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../utils/theme';
import type { AlertItem } from '../services/AlertService';

interface AlertBannerProps {
  alerts: AlertItem[];
}

const AlertBanner: React.FC<AlertBannerProps> = ({ alerts }) => {
  const COLORS = useTheme();
  const styles = typeof getStyles !== "undefined" ? getStyles(COLORS) : {} as any;

  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alerts.length > 0) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 14 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -80, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [alerts.length, slideAnim, opacityAnim]);

  if (alerts.length === 0) return null;

  const latest = alerts[alerts.length - 1];
  const isDanger = latest.type === 'danger';

  return (
    <Animated.View
      style={[
        styles.container,
        isDanger ? styles.dangerBg : styles.warningBg,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}>
      <View style={[styles.accentBar, isDanger ? styles.accentDanger : styles.accentWarning]} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isDanger ? styles.dangerTitle : styles.warningTitle]}>
            {isDanger ? 'Peringatan Kritis' : 'Perhatian'}
          </Text>
          {alerts.length > 1 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{alerts.length}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.message, isDanger ? styles.dangerMsg : styles.warningMsg]}>
          {latest.message}
        </Text>
      </View>
    </Animated.View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
  },
  accentDanger: {
    backgroundColor: COLORS.error,
  },
  accentWarning: {
    backgroundColor: COLORS.warning,
  },
  dangerBg: {
    backgroundColor: COLORS.errorSoft,
  },
  warningBg: {
    backgroundColor: COLORS.warningSoft,
  },
  content: {
    flex: 1,
    padding: 14,
    paddingLeft: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  dangerTitle: {
    color: COLORS.error,
  },
  warningTitle: {
    color: COLORS.warning,
  },
  countBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textMuted,
  },
  message: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 17,
  },
  dangerMsg: {
    color: 'rgba(192,57,43,0.7)',
  },
  warningMsg: {
    color: 'rgba(212,129,10,0.7)',
  },
});

export default AlertBanner;
