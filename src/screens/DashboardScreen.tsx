import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, RefreshControl, AppState, Appearance,
  Animated
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme, setGlobalTheme } from '../utils/theme';
import type { SensorData, ConnectionStatus } from '../services/MqttService';
import { fetchWeather, WeatherData } from '../services/WeatherService';
import { AlertItem } from '../services/AlertService';
import DataStore from '../services/DataStore';
import SensorCard from '../components/SensorCard';
import WeatherCard from '../components/WeatherCard';
import RecommendationCard from '../components/RecommendationCard';
import AlertBanner from '../components/AlertBanner';
import ConnectionStatusBar from '../components/ConnectionStatusBar';
import ActuatorControl from '../components/ActuatorControl';
import MLService from '../services/MLService';
import MqttService from '../services/MqttService';

interface DashboardScreenProps {
  user?: any;
  status: ConnectionStatus;
  sensors: SensorData;
  lastUpdate: string;
  alerts: AlertItem[];
  historyXY: { labels: string[], suhu: number[], hum: number[] };
}

const screenWidth = Dimensions.get('window').width;
const CHART_WIDTH = screenWidth - 48;

const ThemeSwitch = ({ isDark, onToggle, COLORS }: any) => {
  const animValue = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const switchStyles = getThemeSwitchStyles(COLORS);

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
    outputRange: [COLORS.border, COLORS.primary]
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onToggle(!isDark)}>
      <Animated.View style={[switchStyles.track, { backgroundColor: bgColor }]}>
        <Animated.View style={[switchStyles.thumb, { transform: [{ translateX }] }]}>
          <Text style={[switchStyles.icon, isDark ? switchStyles.iconDark : switchStyles.iconLight]}>
            {isDark ? '🌙' : '☀️'}
          </Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  status, sensors, lastUpdate, alerts, historyXY
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeGreenhouse, setActiveGreenhouse] = useState('A');
  const COLORS = useTheme();
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
    backgroundColor: COLORS.background, // Solid background
    backgroundGradientFrom: COLORS.background,
    backgroundGradientTo: COLORS.background,
    decimalPlaces: 0,
    color: (opacity = 1) => COLORS.isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(45, 90, 39, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${COLORS.isDark ? '255, 255, 255' : '45, 90, 39'}, ${opacity * 0.8})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: { fontSize: 10, fontFamily: 'Inter-Bold' },
    propsForBackgroundLines: {
      stroke: COLORS.borderLight,
      strokeDasharray: '',
      strokeWidth: 1,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: COLORS.background,
    }
  };

  const getNutrientStatus = () => {
    if (sensors.ec === '–') return { text: 'Menunggu', color: COLORS.textLight };
    const ec = parseFloat(sensors.ec);
    if (ec > 800) return { text: 'Optimal', color: COLORS.success };
    if (ec > 200) return { text: 'Rendah', color: COLORS.warning };
    return { text: 'Sangat Rendah', color: COLORS.error };
  };

  const nutrientStatus = getNutrientStatus();
  const trends = MLService.predictTrend(DataStore.getRecentHistory(10));

  const greenhouses = user?.greenhouses || ['A'];

  const handleGreenhouseChange = (gh: string) => {
    setActiveGreenhouse(gh);
    // Asumsikan topik untuk A: sensor/xy_md02, B: sensor/xy_md02_b, C: sensor/xy_md02_c
    const topicSuffix = gh === 'A' ? '' : `_${gh.toLowerCase()}`;
    MqttService.updateTopics(`sensor/xy_md02${topicSuffix}`, `sensor/bsk_ec100${topicSuffix}`);
    DataStore.clearHistory();
    DataStore.addLog('info', `Pindah ke Greenhouse ${gh}`, 'system');
  };

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
          <View style={styles.headerRightContent}>
            <ThemeSwitch
              isDark={COLORS.isDark}
              COLORS={COLORS}
              onToggle={(val: boolean) => {
                setGlobalTheme(val);
                if (Appearance.setColorScheme) {
                  Appearance.setColorScheme(val ? 'dark' : 'light');
                }
              }}
            />
          </View>
        </View>
      </View>

      {greenhouses.length > 1 && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, backgroundColor: COLORS.surface }}>
          {greenhouses.map((gh: string) => {
            const isActive = activeGreenhouse === gh;
            return (
              <TouchableOpacity
                key={gh}
                onPress={() => handleGreenhouseChange(gh)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isActive ? COLORS.primary : COLORS.surfaceElevated,
                  marginRight: 12,
                  borderWidth: 1,
                  borderColor: isActive ? COLORS.primary : COLORS.glassBorder,
                }}
              >
                <Text style={{ fontSize: 13, fontFamily: 'Inter-Bold', color: isActive ? COLORS.background : COLORS.textPrimary }}>
                  Greenhouse {gh}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

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
            <SensorCard label="Suhu Udara" subtitle="Iklim Mikro" value={sensors.suhu} unit="°C" color={COLORS.suhu} sensorKey="suhu" trend={trends.suhu} />
            <SensorCard label="Kelembapan" subtitle="Kerapatan Air Udara" value={sensors.kelembapan} unit="%RH" color={COLORS.kelembapan} sensorKey="kelembapan" trend={trends.kelembapan} />
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
            <SensorCard label="EC" subtitle="Kekentalan Nutrisi" value={sensors.ec} unit="µS/cm" color={COLORS.ec} sensorKey="ec" trend={trends.ec} />
            <SensorCard label="TDS" subtitle="Zat Padat Terlarut" value={sensors.tds} unit="ppm" color={COLORS.tds} sensorKey="tds" />
          </View>
          <View style={[styles.grid, styles.nutrientGridSecondary]}>
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
        {user?.role === 'admin' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kendali Perangkat</Text>
              <Text style={styles.sectionTag}>IOT AKTUATOR</Text>
            </View>
            <ActuatorControl />
          </View>
        )}

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
          <Text style={styles.footerText}>AGRISENSE · SMART FARM MONITORING</Text>
          <Text style={styles.footerVersion}>VERSION 1.0.0 (MONOCHROME GLASS)</Text>
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
    paddingTop: 64, 
    paddingBottom: 24,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  headerTitle: {
    fontSize: 30,
    fontFamily: 'Outfit-Bold',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  titleAccent: {
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  logoutText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },

  // ── Content ──
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // ── Section ──
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    letterSpacing: -0.5,
  },
  sectionTag: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  // ── Grid ──
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  nutrientGridSecondary: {
    marginTop: 14,
  },

  // ── Chart ──
  chartCard: {
    marginTop: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    padding: 24,
    paddingBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendLine: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },

  // ── Status Card ──
  statusCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 22,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 3,
  },
  statusLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    letterSpacing: -0.3,
  },
  statusIndicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginTop: 12,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 30,
  },
  footerLine: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginBottom: 20,
    opacity: 0.5,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
  },
  footerVersion: {
    color: COLORS.textLight,
    fontSize: 10,
    marginTop: 6,
    fontFamily: 'Inter-Regular',
  },
});

const getThemeSwitchStyles = (COLORS: any) => StyleSheet.create({
  track: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    fontSize: 11,
  },
  iconLight: {
    transform: [{ translateY: -1 }],
  },
  iconDark: {
    transform: [{ translateY: -1 }, { translateX: 0.5 }],
  },
});

export default DashboardScreen;
