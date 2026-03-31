// ──────────────────────────────────────────────
// AgriSense · Connection Status Bar — Premium
// ──────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../utils/theme';
import type { ConnectionStatus } from '../services/MqttService';

interface StatusBarProps {
  status: ConnectionStatus;
  lastUpdate: string;
}

const ConnectionStatusBar: React.FC<StatusBarProps> = ({ status, lastUpdate }) => {
  const COLORS = useTheme();
  const styles = typeof getStyles !== "undefined" ? getStyles(COLORS) : {} as any;

  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (status === 'Terhubung') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const isLive = status === 'Terhubung';

  return (
    <View style={styles.container}>
      <Text style={styles.updateText}>{lastUpdate}</Text>
      <View style={styles.pill}>
        <Animated.View style={[styles.dot, isLive ? styles.dotLive : styles.dotOff, { opacity: pulseAnim }]} />
        <Text style={styles.statusText}>
          {status}
        </Text>
      </View>
    </View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  updateText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  dotLive: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  dotOff: {
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.textPrimary,
  },
});

export default ConnectionStatusBar;
