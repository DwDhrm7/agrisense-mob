// ──────────────────────────────────────────────
// AgriSense · Connection Status Bar — Premium
// ──────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../utils/config';
import type { ConnectionStatus } from '../services/MqttService';

interface StatusBarProps {
  status: ConnectionStatus;
  lastUpdate: string;
}

const ConnectionStatusBar: React.FC<StatusBarProps> = ({ status, lastUpdate }) => {
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
      <View style={[styles.pill, isLive ? styles.pillLive : styles.pillOff]}>
        <Animated.View style={[styles.dot, isLive ? styles.dotLive : styles.dotOff, { opacity: pulseAnim }]} />
        <Text style={[styles.statusText, isLive ? styles.textLive : styles.textOff]}>
          {status}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  updateText: {
    color: COLORS.textLight,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  pillLive: {
    backgroundColor: COLORS.successSoft,
    borderColor: COLORS.primaryBorder,
  },
  pillOff: {
    backgroundColor: COLORS.errorSoft,
    borderColor: 'rgba(192,57,43,0.12)',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotLive: {
    backgroundColor: COLORS.primary,
  },
  dotOff: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
  textLive: {
    color: COLORS.primary,
  },
  textOff: {
    color: COLORS.error,
  },
});

export default ConnectionStatusBar;
