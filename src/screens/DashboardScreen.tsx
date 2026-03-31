import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, RefreshControl, AppState, Switch, NativeModules, Alert, Appearance,
  Animated
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LIGHT_COLORS, DARK_COLORS } from '../utils/config';
import { useTheme, setGlobalTheme, isDarkModeGlobal } from '../utils/theme';
import MqttService, { SensorData, ConnectionStatus } from '../services/MqttService';
import { fetchWeather, WeatherData } from '../services/WeatherService';
import { AlertItem } from '../services/AlertService';
import DataStore from '../services/DataStore';
import SensorCard from '../components/SensorCard';
import WeatherCard from '../components/WeatherCard';
import RecommendationCard from '../components/RecommendationCard';
import AlertBanner from '../components/AlertBanner';
import ConnectionStatusBar from '../components/ConnectionStatusBar';
import ActuatorControl from '../components/ActuatorControl';

interface DashboardScreenProps {
  user: any;
  onLogout: () => void;
  status: ConnectionStatus;
  sensors: SensorData;
  lastUpdate: string;
  alerts: AlertItem[];
  historyXY: { labels: string[], suhu: number[], hum: number[] };
}

const screenWidth = Dimensions.get('window').width;
const CHART_WIDTH = screenWidth - 48;

const INITIAL_SENSORS: SensorData = {
  suhu: '–', kelembapan: '–', ec: '–', tds: '–', suhuAir: '–',
};

const ThemeSwitch = ({ isDark, onToggle, COLORS }: any) => {
  const animValue = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isDark ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isDark, animValue]);

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 25]
  });

  const bgColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#cbd5e1', COLORS.primary]
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onToggle(!isDark)}>
      <Animated.View style={{
        width: 50, height: 28, borderRadius: 14,
        backgroundColor: bgColor, justifyContent: 'center',
      }}>
        <Animated.View style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: '#ffffff',
          transform: [{ translateX }],
          justifyContent: 'center', alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15, shadowRadius: 3, elevation: 2,
        }}>
          <Text style={{ fontSize: 11, transform: [{ translateY: -1 }, { translateX: isDark ? 0.5 : 0 }] }}>
            {isDark ? '🌙' : '☀️'}
          </Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  user, onLogout, status, sensors, lastUpdate, alerts, historyXY
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const COLORS = useTheme();
  const [isDarkTheme, setIsDarkTheme] = useState(isDarkModeGlobal);
  const styles = getStyles(COLORS);
  
  const appStateRef = useRef(AppState.currentState);

  // ─── Weather ──────────────────────────────
  const loadWeather = useCallback(async () => {
    setWeatherLoading(true);
    const data = await fetchWeather();
    setWeather(data);
    setWeatherLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWeather();
    setRefreshing(false);
  }, [loadWeather]);

  // ─── MQTT ─────────────────────────────────
  // Note: MQTT connection is now managed globally in App.tsx 
  // to ensure connection persists across tab changes and backgrounding.

  useEffect(() => {
    loadWeather().then(() => DataStore.addLog('info', 'Data cuaca dimuat', 'weather'));
    const interval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadWeather]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        loadWeather();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [loadWeather]);

  // ─── Chart Config ─────────────────────────
  const chartConfig = {
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.15})`,
    labelColor: () => COLORS.textLight,
    propsForLabels: { fontSize: 10 },
    propsForBackgroundLines: {
      stroke: COLORS.borderLight,
      strokeDasharray: '',
    },
  };

  const getNutrientStatus = () => {
    if (sensors.ec === '–') return { text: 'Menunggu', color: COLORS.textLight };
    const ec = parseFloat(sensors.ec);
    if (ec > 800) return { text: 'Optimal', color: COLORS.primary };
    if (ec > 200) return { text: 'Rendah', color: COLORS.warning };
    return { text: 'Sangat Rendah', color: COLORS.error };
  };

  const nutrientStatus = getNutrientStatus();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Agri<Text style={styles.titleAccent}>Sense</Text>
          </Text>
          <Text style={styles.headerSub}>Smart Farm Monitoring</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemeSwitch
              isDark={isDarkTheme}
              COLORS={COLORS}
              onToggle={(val: boolean) => {
                setIsDarkTheme(val);
                setGlobalTheme(val);
                if (Appearance.setColorScheme) {
                  Appearance.setColorScheme(val ? 'dark' : 'light');
                }
              }}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }>

        <ConnectionStatusBar status={status} lastUpdate={lastUpdate} />
        <AlertBanner alerts={alerts} />

        {/* ── Cuaca ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cuaca Lokal</Text>
            <Text style={styles.sectionTag}>OPEN-METEO</Text>
          </View>
          <WeatherCard weather={weather} loading={weatherLoading} />
        </View>

        {/* ── Lingkungan Udara ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lingkungan Udara</Text>
            <Text style={styles.sectionTag}>XY-MD02</Text>
          </View>
          <View style={styles.grid}>
            <SensorCard label="Suhu Udara" subtitle="Iklim Mikro" value={sensors.suhu} unit="°C" color={COLORS.suhu} sensorKey="suhu" />
            <SensorCard label="Kelembapan" subtitle="Kerapatan Air Udara" value={sensors.kelembapan} unit="%RH" color={COLORS.kelembapan} sensorKey="kelembapan" />
          </View>

          {/* Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: COLORS.suhu }]} />
                <Text style={styles.legendText}>Suhu</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: COLORS.kelembapan }]} />
                <Text style={styles.legendText}>Kelembapan</Text>
              </View>
            </View>
            <LineChart
              data={{
                labels: historyXY.labels,
                datasets: [
                  { data: historyXY.suhu, color: () => COLORS.suhu, strokeWidth: 2 },
                  { data: historyXY.hum, color: () => COLORS.kelembapan, strokeWidth: 2 },
                ],
              }}
              width={CHART_WIDTH}
              height={180}
              withDots={false}
              withInnerLines={false}
              withOuterLines={false}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        </View>

        {/* ── Nutrisi Air ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nutrisi Air</Text>
            <Text style={styles.sectionTag}>BSK-EC-100</Text>
          </View>
          <View style={styles.grid}>
            <SensorCard label="EC" subtitle="Kekentalan Nutrisi" value={sensors.ec} unit="µS/cm" color={COLORS.ec} sensorKey="ec" />
            <SensorCard label="TDS" subtitle="Zat Padat Terlarut" value={sensors.tds} unit="ppm" color={COLORS.tds} sensorKey="tds" />
          </View>
          <View style={[styles.grid, { marginTop: 14 }]}>
            <SensorCard label="Suhu Air" subtitle="Suhu Tandon" value={sensors.suhuAir} unit="°C" color={COLORS.suhuAir} sensorKey="suhuAir" />
            {/* Status overview */}
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>STATUS NUTRISI</Text>
              <Text style={[styles.statusValue, { color: nutrientStatus.color }]}>
                {nutrientStatus.text}
              </Text>
              <View style={[styles.statusIndicator, { backgroundColor: nutrientStatus.color }]} />
            </View>
          </View>
        </View>

        {/* ── Kendali Perangkat ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kendali Perangkat</Text>
            <Text style={styles.sectionTag}>IOT AKTUATOR</Text>
          </View>
          <ActuatorControl />
        </View>

        {/* ── Rekomendasi ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prediksi Tanam</Text>
            <Text style={styles.sectionTag}>AI</Text>
          </View>
          <RecommendationCard sensors={sensors} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>AgriSense · Monitoring Pertanian Cerdas</Text>
          <Text style={styles.footerVersion}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Regular',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  titleAccent: {
    fontFamily: 'Outfit-Bold',
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.3,
  },

  // ── Content ──
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },

  // ── Section ──
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.3,
  },
  sectionTag: {
    color: COLORS.textLight,
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Grid ──
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },

  // ── Chart ──
  chartCard: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textLight,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },

  // ── Status Card ──
  statusCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    color: COLORS.textLight,
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.3,
  },
  statusIndicator: {
    width: 24,
    height: 2,
    borderRadius: 1,
    marginTop: 10,
    opacity: 0.4,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  footerLine: {
    width: 32,
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.5,
  },
  footerVersion: {
    color: COLORS.borderLight,
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
});

export default DashboardScreen;
