# LAPORAN LENGKAP: APLIKASI AGRISENSE MOBILE

> **Dokumen ini berisi seluruh kode sumber dan arsitektur aplikasi AgriSense Mobile secara lengkap.**
> Disiapkan untuk membantu penyusunan laporan akademik/teknis.

---

## DAFTAR ISI

1. [Ringkasan Proyek](#1-ringkasan-proyek)
2. [Struktur Direktori](#2-struktur-direktori)
3. [Konfigurasi Proyek](#3-konfigurasi-proyek)
4. [Entry Point & App Root](#4-entry-point--app-root)
5. [Konfigurasi & Tema](#5-konfigurasi--tema)
6. [Services (Layanan)](#6-services-layanan)
7. [Hooks](#7-hooks)
8. [Components (Komponen UI)](#8-components-komponen-ui)
9. [Screens (Halaman)](#9-screens-halaman)
10. [Python Backend](#10-python-backend)
11. [Environment Variables](#11-environment-variables)

---

## 1. RINGKASAN PROYEK

**Nama Aplikasi:** AgriSense Mobile
**Platform:** Android (React Native)
**Bahasa Pemrograman:** TypeScript (React Native), Python (Backend)
**Versi React Native:** 0.84.1
**Versi React:** 19.2.3

### Deskripsi
AgriSense adalah aplikasi monitoring pertanian cerdas (smart farm) berbasis IoT yang dirancang untuk memantau kondisi lingkungan greenhouse secara real-time. Aplikasi ini menerima data sensor melalui protokol MQTT, menampilkan visualisasi data, memberikan rekomendasi tanaman berbasis aturan (rule-based), dan terintegrasi dengan Gemini AI untuk analisis lanjutan.

### Fitur Utama
- **Monitoring Real-Time:** Menerima data sensor (suhu udara, kelembapan, EC, TDS, suhu air) via MQTT (WebSocket)
- **Visualisasi Data:** Grafik real-time suhu dan kelembapan menggunakan `react-native-chart-kit`
- **Sistem Peringatan (Alert):** Notifikasi otomatis saat sensor melewati ambang batas yang dikonfigurasi
- **Rekomendasi Tanaman (Rule-Based):** Sistem rekomendasi berbasis aturan (rule-based) yang memprediksi tanaman optimal berdasarkan kondisi sensor
- **Integrasi AI (Gemini):** Analisis lanjutan menggunakan Google Gemini AI API
- **Kendali Aktuator:** Kontrol pompa irigasi, kipas sirkulasi, dan lampu growlight via MQTT
- **Otomasi Jadwal:** Penjadwalan otomatis aktuator berdasarkan hari dan jam
- **Data Cuaca:** Integrasi Open-Meteo API untuk data cuaca lokal
- **Multi-Greenhouse:** Dukungan monitoring beberapa greenhouse
- **Riwayat Data:** Penyimpanan dan tampilan riwayat pembacaan sensor
- **Log Aktivitas:** Pencatatan semua event sistem dengan filter
- **Manajemen Pengguna:** Sistem autentikasi dengan role admin/user
- **Kalibrasi Sensor:** Fitur offset kalibrasi untuk masing-masing sensor
- **Ekspor Data CSV:** Export riwayat sensor ke format CSV
- **Dark Mode / Light Mode:** Tema dinamis dengan desain Glassmorphism

### Arsitektur Sensor IoT
| Sensor | Model | Parameter | Satuan |
|--------|-------|-----------|--------|
| XY-MD02 | Modbus RS485 | Suhu Udara, Kelembapan | °C, %RH |
| BSK-EC-100 | Modbus RS485 | EC, TDS, Suhu Air | µS/cm, ppm, °C |

### Protokol Komunikasi
- **MQTT over WebSocket (WSS)** — Port 8884/443
- **Library:** paho-mqtt (client-side)
- **Topik Sensor:** `sensor/xy_md02` (suhu & kelembapan), `sensor/bsk_ec100` (EC, TDS, suhu air)
- **Topik Aktuator:** `actuator/pompa`, `actuator/kipas`, `actuator/growlight`

---

## 2. STRUKTUR DIREKTORI

```
AgriSense-Mobile/
├── App.tsx                          # Root component
├── index.js                         # Entry point
├── package.json                     # Dependencies
├── babel.config.js                  # Babel config (dotenv)
├── tsconfig.json                    # TypeScript config
├── .env.example                     # Environment variables template
│
├── src/
│   ├── components/
│   │   ├── ActuatorControl.tsx      # Kendali aktuator IoT
│   │   ├── AlertBanner.tsx          # Banner peringatan sensor
│   │   ├── ConnectionStatusBar.tsx  # Status koneksi MQTT
│   │   ├── RecommendationCard.tsx   # Kartu rekomendasi tanaman
│   │   ├── SensorCard.tsx           # Kartu pembacaan sensor
│   │   ├── TabBar.tsx               # Navigasi tab bawah
│   │   └── WeatherCard.tsx          # Kartu cuaca lokal
│   │
│   ├── screens/
│   │   ├── DashboardScreen.tsx      # Dashboard utama
│   │   ├── HistoryScreen.tsx        # Riwayat data sensor
│   │   ├── LogScreen.tsx            # Log aktivitas sistem
│   │   ├── LoginScreen.tsx          # Halaman login
│   │   └── SettingsScreen.tsx       # Pengaturan & konfigurasi
│   │
│   ├── services/
│   │   ├── AlertService.ts          # Logika alert/peringatan
│   │   ├── DataStore.ts             # Penyimpanan data in-memory
│   │   ├── GeminiService.ts         # Integrasi Google Gemini AI
│   │   ├── MLService.ts             # Rekomendasi tanaman (rule-based)
│   │   ├── MqttService.ts           # Koneksi MQTT
│   │   └── WeatherService.ts        # API cuaca Open-Meteo
│   │
│   ├── hooks/
│   │   └── useMqttMonitorHook.ts    # Hook MQTT monitoring
│   │
│   ├── utils/
│   │   ├── config.ts                # Konfigurasi & konstanta
│   │   └── theme.ts                 # Sistem tema dark/light
│   │
│   └── assets/
│       └── images/
│           └── logo.png
│
└── python-backend/
    ├── train.py                     # Script training ML (TensorFlow)
    ├── export_model.py              # Ekspor model ke TF.js
    ├── data_collector.py            # Flask API pengumpul data
    ├── sensor_aggregator.py         # Agregator data sensor
    ├── iot_service_improved.py      # Service IoT
    └── requirements.txt             # Python dependencies
```

---

## 3. KONFIGURASI PROYEK

### 3.1 package.json

```json
{
  "name": "agrisense-mobile",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "lint": "eslint .",
    "start": "react-native start",
    "test": "jest"
  },
  "dependencies": {
    "@notifee/react-native": "^9.1.8",
    "@react-native/new-app-screen": "0.84.1",
    "@tensorflow/tfjs-react-native": "^1.0.0",
    "expo-file-system": "^15.4.5",
    "paho-mqtt": "^1.1.0",
    "react": "19.2.3",
    "react-native": "0.84.1",
    "react-native-chart-kit": "^6.12.0",
    "react-native-safe-area-context": "^5.7.0",
    "react-native-svg": "^15.15.4"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@babel/preset-env": "^7.25.3",
    "@babel/runtime": "^7.25.0",
    "@react-native-community/cli": "20.1.0",
    "@react-native-community/cli-platform-android": "20.1.0",
    "@react-native-community/cli-platform-ios": "20.1.0",
    "@react-native/babel-preset": "0.84.1",
    "@react-native/eslint-config": "0.84.1",
    "@react-native/metro-config": "0.84.1",
    "@react-native/typescript-config": "0.84.1",
    "@types/jest": "^29.5.13",
    "@types/react": "^19.2.0",
    "@types/react-test-renderer": "^19.1.0",
    "eslint": "^8.19.0",
    "jest": "^29.6.3",
    "prettier": "2.8.8",
    "react-native-dotenv": "^3.4.11",
    "react-test-renderer": "19.2.3",
    "typescript": "^5.8.3"
  },
  "engines": {
    "node": ">= 22.11.0"
  }
}
```

### 3.2 babel.config.js

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
        verbose: false,
      },
    ],
  ],
};
```

### 3.3 index.js (Entry Point)

```javascript
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

---

## 4. ENTRY POINT & APP ROOT

### 4.1 App.tsx

```tsx
import React, { useState } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LogScreen from './src/screens/LogScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TabBar, { TabId } from './src/components/TabBar';
import MqttService from './src/services/MqttService';
import { useMqttMonitor } from './src/hooks/useMqttMonitorHook';
import { useTheme } from './src/utils/theme';

// Polyfill for Paho MQTT which attempts to access localStorage
// @ts-ignore
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const App = () => {
  const COLORS = useTheme();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  
  // MQTT is now managed universally across tabs
  const mqttState = useMqttMonitor();

  const handleLogin = (userData: any) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    MqttService.disconnect();
    setUser(null);
    setActiveTab('dashboard');
  };

  // Reset alert badge when opening log tab
  const handleTabChange = (tab: TabId) => {
    if (tab === 'log') mqttState.setAlertCount(0);
    setActiveTab(tab);
  };

  const isDark = COLORS.background !== '#F9FBF9'; // Simple check for dark mode

  if (!user) {
    return (
      <SafeAreaProvider>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={COLORS.background} 
          translucent={false} 
        />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={COLORS.background} 
        translucent={false} 
      />
      <SafeAreaView style={[styles.root, { backgroundColor: COLORS.background }]}>
        <View style={styles.screenContainer}>
          {activeTab === 'dashboard' && (
            <DashboardScreen 
              user={user} 
              status={mqttState.status}
              sensors={mqttState.sensors}
              lastUpdate={mqttState.lastUpdate}
              alerts={mqttState.alerts}
              historyXY={mqttState.historyXY}
            />
          )}
          {activeTab === 'history' && <HistoryScreen />}
          {activeTab === 'log' && <LogScreen />}
          {activeTab === 'settings' && (
            <SettingsScreen
              user={user}
              connectionStatus={mqttState.status}
              onLogout={handleLogout}
            />
          )}
        </View>
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} alertCount={mqttState.alertCount} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});

export default App;
```

---

## 5. KONFIGURASI & TEMA

### 5.1 src/utils/config.ts

```typescript
import {
  MQTT_HOST,
  MQTT_PORT,
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_TOPIC_XY,
  MQTT_TOPIC_BSK,
  INFLUX_HOST,
  INFLUX_DB,
  OPENMETEO_LATITUDE,
  OPENMETEO_LONGITUDE,
  GEMINI_API_KEY,
} from '@env';

export const MQTT_CONFIG = {
  host: MQTT_HOST || '',
  port: Number(MQTT_PORT) || 8884,
  path: '/mqtt',
  useSSL: true,
  username: MQTT_USERNAME || '',
  password: MQTT_PASSWORD || '',
  topicXY: MQTT_TOPIC_XY || 'sensor/xy_md02',
  topicBSK: MQTT_TOPIC_BSK || 'sensor/bsk_ec100',
};

export const INFLUX_CONFIG = {
  host: INFLUX_HOST || 'http://192.168.0.79:8086',
  db: INFLUX_DB || 'sensor_db',
  interval: 7000,
};

export const OPENMETEO_CONFIG = {
  enabled: true,
  latitude: Number(OPENMETEO_LATITUDE) || -8.65,
  longitude: Number(OPENMETEO_LONGITUDE) || 115.2167,
  timezone: 'Asia/Singapore',
  city: 'Denpasar',
};

export const GEMINI_CONFIG = {
  enabled: true,
  apiKey: GEMINI_API_KEY, 
};

// Ambang batas sensor untuk alert
export const SENSOR_THRESHOLDS = {
  suhu: { min: 18, max: 35, unit: '°C', label: 'Suhu Udara' },
  kelembapan: { min: 40, max: 90, unit: '%RH', label: 'Kelembapan' },
  ec: { min: 200, max: 2500, unit: 'µS/cm', label: 'EC' },
  tds: { min: 100, max: 1500, unit: 'ppm', label: 'TDS' },
  suhuAir: { min: 15, max: 32, unit: '°C', label: 'Suhu Air' },
};

export const LIGHT_COLORS = {
  primary: '#2D5A27',
  primarySoft: 'rgba(45, 90, 39, 0.05)',
  primaryBorder: 'rgba(45, 90, 39, 0.15)',
  background: '#F9FBF9',
  surface: 'rgba(255, 255, 255, 0.35)',
  surfaceElevated: 'rgba(255, 255, 255, 0.55)', 
  glassBorder: 'rgba(45, 90, 39, 0.2)',
  glassShadow: 'rgba(45, 90, 39, 0.06)',
  textPrimary: '#1A2F1A',
  textSecondary: '#2D402D',
  textMuted: '#6B7A6B',
  textLight: '#A3AFA3',
  border: 'rgba(45, 90, 39, 0.1)',
  borderLight: 'rgba(45, 90, 39, 0.05)',
  error: '#AE445A',
  errorSoft: 'rgba(174,68,90,0.08)',
  warning: '#D89216',
  warningSoft: 'rgba(216,146,22,0.08)',
  success: '#4E9F3D',
  successSoft: 'rgba(78,159,61,0.08)',
  suhu: '#AE445A',
  kelembapan: '#2D5A27',
  ec: '#4E9F3D',
  tds: '#795548',
  suhuAir: '#5D4037',
};

export const DARK_COLORS = {
  primary: '#96B096',
  primarySoft: 'rgba(150, 176, 150, 0.05)',
  primaryBorder: 'rgba(150, 176, 150, 0.15)',
  background: '#0E120E',
  surface: 'rgba(255, 255, 255, 0.03)',
  surfaceElevated: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassShadow: 'rgba(0, 0, 0, 0.45)',
  textPrimary: '#E8EDE8',
  textSecondary: '#C5CDC5',
  textMuted: '#7D8A7D',
  textLight: '#4B544B',
  border: 'rgba(255, 255, 255, 0.05)',
  borderLight: 'rgba(255, 255, 255, 0.02)',
  error: '#CF6679',
  errorSoft: 'rgba(207, 102, 121, 0.08)',
  warning: '#F3B431',
  warningSoft: 'rgba(243, 180, 49, 0.08)',
  success: '#81B622',
  successSoft: 'rgba(129, 182, 34, 0.08)',
  suhu: '#CF6679', 
  kelembapan: '#5BB381',
  ec: '#81B622',
  tds: '#A8907E',
  suhuAir: '#7B8FA1',
};

export const TYPOGRAPHY = {
  fontLight: '300',
  fontRegular: '400',
  fontMedium: '500',
  fontSemibold: '600',
  fontBold: '700',
  fontBlack: '800',
} as const;
```

### 5.2 src/utils/theme.ts

```typescript
import { useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from './config';

export let isDarkModeGlobal = Appearance.getColorScheme() === 'dark';
const listeners = new Set<() => void>();

export const setGlobalTheme = (isDark: boolean) => {
    isDarkModeGlobal = isDark;
    listeners.forEach(l => l());
};

export const useTheme = () => {
    const [isDark, setIsDark] = useState(isDarkModeGlobal);
    
    useEffect(() => {
        const handler = () => setIsDark(isDarkModeGlobal);
        listeners.add(handler);
        return () => { listeners.delete(handler); }
    }, []);
    
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
    return { ...colors, isDark };
};
```

---

## 6. SERVICES (LAYANAN)

### 6.1 MqttService.ts — Layanan Koneksi MQTT

```typescript
// ──────────────────────────────────────────────
// AgriSense · MQTT Service
// ──────────────────────────────────────────────
import { MQTT_CONFIG } from '../utils/config';

export interface SensorData {
  suhu: string;
  kelembapan: string;
  ec: string;
  tds: string;
  suhuAir: string;
}

export type ConnectionStatus = 'Menginisialisasi...' | 'Menghubungkan...' | 'Terhubung' | 'Terputus' | string;

type SensorCallback = (data: Partial<SensorData>, topic: string) => void;
type StatusCallback = (status: ConnectionStatus) => void;

class MqttService {
  private client: any = null;
  private onSensorData: SensorCallback | null = null;
  private onStatusChange: StatusCallback | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnected = false;
  private currentTopicXY = MQTT_CONFIG.topicXY;
  private currentTopicBSK = MQTT_CONFIG.topicBSK;
  
  // Try multiple configurations (like Astro version)
  private brokerVariants: { host: string; port: number; path: string }[] = [];
  private currentVariantIndex = 0;

  connect(onSensor: SensorCallback, onStatus: StatusCallback) {
    this.onSensorData = onSensor;
    this.onStatusChange = onStatus;
    
    // Build variants (same ports as Astro version: 8884 and 443)
    const host = MQTT_CONFIG.host;
    this.brokerVariants = [
      { host, port: 8884, path: '/mqtt' },
      { host, port: 443, path: '/mqtt' },
      { host, port: 8884, path: '/ws' },
    ];
    this.currentVariantIndex = 0;
    
    this._doConnect();
  }

  private _doConnect() {
    try {
      const Paho = require('paho-mqtt');
      const variant = this.brokerVariants[this.currentVariantIndex];
      const clientId = 'agrisense-app-' + Math.random().toString(16).slice(2, 8);
      const protocol = MQTT_CONFIG.useSSL ? 'wss' : 'ws';
      const brokerUri = `${protocol}://${variant.host}:${variant.port}${variant.path}`;

      console.log(`[MQTT] [Try ${this.currentVariantIndex + 1}/${this.brokerVariants.length}] Connecting via: ${brokerUri}`);
      
      if (this.onStatusChange) {
        this.onStatusChange(`Menghubungkan (${variant.port})...`);
      }

      this.client = new Paho.Client(brokerUri, clientId);

      this.client.onConnectionLost = (resp: any) => {
        console.warn('[MQTT] Connection lost:', resp?.errorMessage || 'Unknown');
        this.isConnected = false;
        this.onStatusChange?.('Terputus');
        this._scheduleReconnect();
      };

      this.client.onMessageArrived = (message: any) => {
        this._handleMessage(message);
      };

      const connectOptions = {
        useSSL: MQTT_CONFIG.useSSL,
        userName: MQTT_CONFIG.username || '',
        password: MQTT_CONFIG.password || '',
        timeout: 10,
        keepAliveInterval: 30,
        cleanSession: true,
        mqttVersion: 4, 
        onSuccess: () => {
          console.log('[MQTT] Connected successfully to', variant.host, 'on port', variant.port);
          this.isConnected = true;
          this.onStatusChange?.('Terhubung');

          // Subscribe
          const topics = [this.currentTopicXY, this.currentTopicBSK, 'sensor/+', 'sensor/#'];
          topics.forEach(t => t && this.client.subscribe(t));
          console.log('[MQTT] Subscribed to telemetry topics.');
        },
        onFailure: (err: any) => {
          console.error(`[MQTT] Failed on port ${variant.port}:`, err?.errorMessage);
          this.isConnected = false;
          
          // Try next variant if available
          if (this.currentVariantIndex < this.brokerVariants.length - 1) {
            console.log('[MQTT] Falling back to next broker variant...');
            this.currentVariantIndex++;
            this._doConnect();
          } else {
            this.onStatusChange?.(`Gagal: ${err?.errorMessage || 'Network error'}`);
            this._scheduleReconnect();
          }
        },
      };

      this.client.connect(connectOptions);
    } catch (e: any) {
      console.error('[MQTT] Init error:', e?.message);
      this.onStatusChange?.('Gagal: Error internal');
    }
  }

  private _scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected) {
        console.log('[MQTT] Retrying initial connection strategy...');
        this.currentVariantIndex = 0;
        this._doConnect();
      }
    }, 10000);
  }

  private _handleMessage(message: any) {
    try {
      const topic = message.destinationName;
      const raw = message.payloadString;
      console.log(`[MQTT] Data: ${topic} => ${raw}`);

      let data: any;
      try { data = JSON.parse(raw); } catch { return; }

      const isXY = topic === this.currentTopicXY || topic.includes('xy');
      const isBSK = topic === this.currentTopicBSK || topic.includes('bsk');

      if (isXY) {
        this._handleXYData(data, topic);
      } else if (isBSK) {
        this._handleBSKData(data, topic);
      } else {
        if (data.suhu !== undefined || data.kelembapan !== undefined || data.humidity !== undefined || data.temp !== undefined) {
          this._handleXYData(data, topic);
        }
        if (data.ec !== undefined || data.tds !== undefined || data.EC !== undefined || data.TDS !== undefined) {
          this._handleBSKData(data, topic);
        }
      }
    } catch (e: any) {
      console.warn('[MQTT] Handle error:', e?.message);
    }
  }

  private _handleXYData(data: any, _topic: string) {
    const suhu = data.suhu ?? data.temperature ?? data.temp ?? null;
    const kelembapan = data.kelembapan ?? data.humidity ?? data.hum ?? null;
    const result: Partial<SensorData> = {};
    if (suhu !== null && !isNaN(parseFloat(suhu))) result.suhu = parseFloat(suhu).toFixed(1);
    if (kelembapan !== null && !isNaN(parseFloat(kelembapan))) result.kelembapan = parseFloat(kelembapan).toFixed(1);
    if (Object.keys(result).length > 0) {
      this.onSensorData?.(result, 'xy');
    }
  }

  private _handleBSKData(data: any, _topic: string) {
    const ec = data.ec ?? data.EC ?? null;
    const tds = data.tds ?? data.TDS ?? null;
    const temp = data.temperature ?? data.temp ?? data.suhu ?? data.suhuAir ?? null;
    const result: Partial<SensorData> = {};
    if (ec !== null && !isNaN(parseFloat(ec))) result.ec = parseFloat(ec).toString();
    if (tds !== null && !isNaN(parseFloat(tds))) result.tds = parseFloat(tds).toString();
    if (temp !== null && !isNaN(parseFloat(temp))) result.suhuAir = parseFloat(temp).toFixed(1);
    if (Object.keys(result).length > 0) {
      this.onSensorData?.(result, 'bsk');
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    try { if (this.client && this.isConnected) this.client.disconnect(); } catch {}
    this.isConnected = false;
  }

  getConnected() { return this.isConnected; }

  updateTopics(topicXY: string, topicBSK: string) {
    if (this.currentTopicXY === topicXY && this.currentTopicBSK === topicBSK) return;
    
    if (this.isConnected && this.client) {
      try {
        this.client.unsubscribe(this.currentTopicXY);
        this.client.unsubscribe(this.currentTopicBSK);
        this.client.subscribe(topicXY);
        this.client.subscribe(topicBSK);
      } catch (e) {
        console.warn('[MQTT] Unsubscribe/Subscribe error', e);
      }
    }
    
    this.currentTopicXY = topicXY;
    this.currentTopicBSK = topicBSK;
    console.log(`[MQTT] Switched topics to ${topicXY} and ${topicBSK}`);
  }

  publishControl(topic: string, state: boolean) {
    if (!this.isConnected || !this.client) {
      console.warn('[MQTT] Cannot publish, not connected');
      return false;
    }
    try {
      const Paho = require('paho-mqtt');
      const payload = state ? 'ON' : 'OFF';
      const message = new Paho.Message(payload);
      message.destinationName = topic;
      this.client.send(message);
      console.log(`[MQTT] Published ${payload} to ${topic}`);
      return true;
    } catch (e: any) {
      console.error('[MQTT] Publish error:', e?.message);
      return false;
    }
  }
}

export default new MqttService();
```

### 6.2 AlertService.ts — Layanan Peringatan Sensor

```typescript
// ──────────────────────────────────────────────
// AgriSense · Alert / Notification Service
// ──────────────────────────────────────────────
import { SENSOR_THRESHOLDS } from '../utils/config';
import type { SensorData } from './MqttService';

export interface AlertItem {
  id: string;
  type: 'warning' | 'danger' | 'info';
  sensor: string;
  message: string;
  value: string;
  sop?: string;
  timestamp: Date;
}

const alertCooldowns: Record<string, number> = {};
const COOLDOWN_MS = 60_000; // 1 menit cooldown per sensor

function getSop(key: string, type: 'low' | 'high'): string {
  if (key === 'suhu') return type === 'high' ? 'SOP: Nyalakan kipas sirkulasi / exhaust.' : 'SOP: Kurangi ventilasi udara luar.';
  if (key === 'kelembapan') return type === 'high' ? 'SOP: Nyalakan kipas exhaust untuk mengurangi kelembapan.' : 'SOP: Nyalakan misting / siram lantai greenhouse.';
  if (key === 'ec' || key === 'tds') return type === 'high' ? 'SOP: Tambahkan air baku ke tandon untuk mengencerkan.' : 'SOP: Tambahkan pekatan nutrisi AB Mix ke tandon.';
  if (key === 'suhuAir') return type === 'high' ? 'SOP: Sirkulasikan air tandon atau tambahkan air segar.' : 'SOP: Pastikan suhu tandon tidak membeku.';
  return 'SOP: Periksa kondisi fisik di lapangan.';
}

export function checkThresholds(sensors: SensorData): AlertItem[] {
  const alerts: AlertItem[] = [];
  const now = Date.now();

  const entries: Array<{ key: keyof typeof SENSOR_THRESHOLDS; raw: string }> = [
    { key: 'suhu', raw: sensors.suhu },
    { key: 'kelembapan', raw: sensors.kelembapan },
    { key: 'ec', raw: sensors.ec },
    { key: 'tds', raw: sensors.tds },
    { key: 'suhuAir', raw: sensors.suhuAir },
  ];

  for (const { key, raw } of entries) {
    const val = parseFloat(raw);
    if (isNaN(val) || raw === '–') continue;

    const threshold = SENSOR_THRESHOLDS[key];
    const cooldownKey = key;
    const lastAlert = alertCooldowns[cooldownKey] || 0;

    if (now - lastAlert < COOLDOWN_MS) continue;

    if (val < threshold.min) {
      alertCooldowns[cooldownKey] = now;
      alerts.push({
        id: `${key}-low-${now}`,
        type: 'warning',
        sensor: threshold.label,
        message: `${threshold.label} terlalu rendah: ${val}${threshold.unit} (min: ${threshold.min}${threshold.unit})`,
        value: `${val}${threshold.unit}`,
        sop: getSop(key, 'low'),
        timestamp: new Date(),
      });
    } else if (val > threshold.max) {
      alertCooldowns[cooldownKey] = now;
      alerts.push({
        id: `${key}-high-${now}`,
        type: 'danger',
        sensor: threshold.label,
        message: `${threshold.label} terlalu tinggi: ${val}${threshold.unit} (max: ${threshold.max}${threshold.unit})`,
        value: `${val}${threshold.unit}`,
        sop: getSop(key, 'high'),
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}
```

### 6.3 DataStore.ts — Penyimpanan Data In-Memory

```typescript
// ──────────────────────────────────────────────
// AgriSense · Data Store (In-Memory + Shared)
// ──────────────────────────────────────────────
// Central data store for sensor history, activity
// logs, and shared state across all screens.
// ──────────────────────────────────────────────

export interface HistoryEntry {
  time: string;
  timestamp: number;
  suhu: number | null;
  kelembapan: number | null;
  ec: number | null;
  tds: number | null;
  suhuAir: number | null;
}

export interface LogEntry {
  id: string;
  time: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  source: string;
}

const HISTORY_MAX = 100;
const LOG_MAX = 200;

class DataStore {
  private history: HistoryEntry[] = [];
  private logs: LogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private logListeners: Set<() => void> = new Set();
  private userListeners: Set<() => void> = new Set();

  private users: Record<string, { password: string; role: string; name: string; greenhouses: string[] }> = {
    admin: { password: 'admin123', role: 'admin', name: 'Administrator', greenhouses: ['A', 'B', 'C'] },
    magang: { password: 'magang123', role: 'user', name: 'Magang', greenhouses: ['A'] },
  };

  // ─── Users ──────────────────────────────────
  getUsers() { return { ...this.users }; }
  addUser(username: string, user: { password: string; role: string; name: string; greenhouses?: string[] }) {
    this.users[username] = { ...user, greenhouses: user.greenhouses || ['A'] };
    this._notifyUsers();
  }
  updateUser(username: string, user: { password: string; role: string; name: string; greenhouses?: string[] }) {
    if (this.users[username]) {
      this.users[username] = { ...this.users[username], ...user, greenhouses: user.greenhouses || this.users[username].greenhouses };
      this._notifyUsers();
    }
  }
  removeUser(username: string) {
    if (username !== 'admin') {
      delete this.users[username];
      this._notifyUsers();
    }
  }
  onUsersChange(fn: () => void): () => void {
    this.userListeners.add(fn);
    return () => { this.userListeners.delete(fn); };
  }
  private _notifyUsers() { this.userListeners.forEach(fn => fn()); }

  private offsets = { suhu: 0, kelembapan: 0, ec: 0, tds: 0, suhuAir: 0 };

  // ─── Offsets ────────────────────────────────
  getOffsets() { return { ...this.offsets }; }
  setOffsets(newOffsets: Partial<typeof this.offsets>) { this.offsets = { ...this.offsets, ...newOffsets }; }

  // ─── History ────────────────────────────────
  pushHistory(entry: Omit<HistoryEntry, 'timestamp'>) {
    this.history.push({ ...entry, timestamp: Date.now() });
    if (this.history.length > HISTORY_MAX) this.history.shift();
    this._notifyHistory();
  }
  getHistory(): HistoryEntry[] { return [...this.history]; }
  getRecentHistory(count: number): HistoryEntry[] { return this.history.slice(-count); }
  clearHistory() { this.history = []; this._notifyHistory(); }
  onHistoryChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }
  private _notifyHistory() { this.listeners.forEach(fn => fn()); }

  // ─── Logs ───────────────────────────────────
  addLog(level: LogEntry['level'], message: string, source: LogEntry['source'] = 'system') {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0') + ':' +
      now.getSeconds().toString().padStart(2, '0');
    this.logs.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time, timestamp: Date.now(), level, message, source,
    });
    if (this.logs.length > LOG_MAX) this.logs.pop();
    this._notifyLogs();
  }
  getLogs(): LogEntry[] { return [...this.logs]; }
  getLogsBySource(source: string): LogEntry[] { return this.logs.filter(l => l.source === source); }
  getLogsByLevel(level: LogEntry['level']): LogEntry[] { return this.logs.filter(l => l.level === level); }
  clearLogs() { this.logs = []; this._notifyLogs(); }
  onLogsChange(fn: () => void): () => void {
    this.logListeners.add(fn);
    return () => { this.logListeners.delete(fn); };
  }
  private _notifyLogs() { this.logListeners.forEach(fn => fn()); }

  // ─── Stats ──────────────────────────────────
  getStats() {
    const h = this.history;
    if (h.length === 0) {
      return { totalReadings: 0, uptime: '–', avgSuhu: null, avgKelembapan: null, avgEc: null, minSuhu: null, maxSuhu: null, minKelembapan: null, maxKelembapan: null };
    }
    const suhuVals = h.map(e => e.suhu).filter((v): v is number => v !== null);
    const humVals = h.map(e => e.kelembapan).filter((v): v is number => v !== null);
    const ecVals = h.map(e => e.ec).filter((v): v is number => v !== null);
    const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
    const min = (arr: number[]) => arr.length ? Math.round(Math.min(...arr) * 10) / 10 : null;
    const max = (arr: number[]) => arr.length ? Math.round(Math.max(...arr) * 10) / 10 : null;
    const firstTs = h[0]?.timestamp ?? Date.now();
    const elapsed = Date.now() - firstTs;
    const mins = Math.floor(elapsed / 60000);
    const uptime = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return { totalReadings: h.length, uptime, avgSuhu: avg(suhuVals), avgKelembapan: avg(humVals), avgEc: avg(ecVals), minSuhu: min(suhuVals), maxSuhu: max(suhuVals), minKelembapan: min(humVals), maxKelembapan: max(humVals) };
  }
}

export default new DataStore();
```

### 6.4 MLService.ts — Rekomendasi Tanaman (Rule-Based)

```typescript
// ──────────────────────────────────────────────
// AgriSense · Recommendation Service (Rule-Based)
// ──────────────────────────────────────────────

import type { SensorData } from './MqttService';

export interface CropPrediction {
  crop: string;
  confidence: number;
  optimalRange: {
    suhu: [number, number];
    kelembapan: [number, number];
    ec: [number, number];
  };
  growthDays: number;
  tips: string[];
}

export interface MLPredictionResult {
  topCrops: CropPrediction[];
  environmentScore: number;
  timestamp: number;
}

export interface TrendPrediction {
  suhu: 'Naik' | 'Turun' | 'Stabil';
  kelembapan: 'Naik' | 'Turun' | 'Stabil';
  ec: 'Naik' | 'Turun' | 'Stabil';
}

// Database komoditas tanaman dengan metadata
const CROPS_DB: Record<string, CropPrediction> = {
  'selada': {
    crop: 'Selada (Lettuce)',
    optimalRange: { suhu: [15, 25], kelembapan: [60, 80], ec: [800, 1500] },
    growthDays: 35,
    tips: ['Jaga pH air 5.5-6.5', 'Pastikan sirkulasi udara baik', 'Hindari genangan air'],
    confidence: 0,
  },
  'bayam': {
    crop: 'Bayam (Spinach)',
    optimalRange: { suhu: [16, 28], kelembapan: [55, 75], ec: [900, 1400] },
    growthDays: 28,
    tips: ['Tumbuh cepat di kelembapan tinggi', 'Cahaya moderat cukup', 'Panen rutin untuk trigger pertumbuhan'],
    confidence: 0,
  },
  'kangkung': {
    crop: 'Kangkung',
    optimalRange: { suhu: [20, 30], kelembapan: [60, 85], ec: [1000, 1600] },
    growthDays: 25,
    tips: ['Sangat cocok hidroponik', 'Toleran terhadap penyakit', 'Air mengalir diperlukan'],
    confidence: 0,
  },
  'sawi': {
    crop: 'Sawi (Mustard Greens)',
    optimalRange: { suhu: [20, 32], kelembapan: [50, 80], ec: [1100, 1700] },
    growthDays: 32,
    tips: ['Tahan panas ringan', 'Butuh nitrogen cukup', 'Siram konsisten'],
    confidence: 0,
  },
  'pakcoy': {
    crop: 'Pakcoy',
    optimalRange: { suhu: [18, 28], kelembapan: [55, 80], ec: [1000, 1500] },
    growthDays: 28,
    tips: ['EC ideal 1000-1500 µS/cm', 'Hindari gelang boron', 'Panen saat daun 4-5 helai'],
    confidence: 0,
  },
  'cabai': {
    crop: 'Cabai Rawit',
    optimalRange: { suhu: [25, 35], kelembapan: [60, 80], ec: [1400, 2000] },
    growthDays: 90,
    tips: ['Optimal di suhu tinggi', 'Butuh cahaya penuh', 'Panen berkala meningkatkan produksi'],
    confidence: 0,
  },
  'tomat': {
    crop: 'Tomat Cherry',
    optimalRange: { suhu: [24, 32], kelembapan: [65, 80], ec: [1500, 2100] },
    growthDays: 60,
    tips: ['Produktivitas tinggi pada suhu hangat', 'Pemangkasan rutin perlu', 'Dukung dengan ajir'],
    confidence: 0,
  },
  'terong': {
    crop: 'Terong',
    optimalRange: { suhu: [25, 35], kelembapan: [60, 75], ec: [1300, 1900] },
    growthDays: 70,
    tips: ['Menyukai 25-35°C', 'Cahaya penuh dibutuhkan', 'Olah tanah dalam sebelum tanam'],
    confidence: 0,
  },
  'kemangi': {
    crop: 'Kemangi',
    optimalRange: { suhu: [25, 35], kelembapan: [50, 75], ec: [1000, 1500] },
    growthDays: 30,
    tips: ['Aroma terbaik pada suhu hangat', 'Panen daun rutin dari atas', 'Cegah bunga untuk hasil panjang'],
    confidence: 0,
  },
  'mentimun': {
    crop: 'Mentimun',
    optimalRange: { suhu: [20, 32], kelembapan: [65, 85], ec: [1200, 1800] },
    growthDays: 45,
    tips: ['Tumbuh cepat di suhu hangat', 'Butuh air cukup', 'Ajir/trelis diperlukan'],
    confidence: 0,
  },
  'seledri': {
    crop: 'Seledri',
    optimalRange: { suhu: [15, 25], kelembapan: [65, 80], ec: [1100, 1600] },
    growthDays: 70,
    tips: ['Tahan iklim sejuk', 'Pencahayaan moderat', 'Tanah harus selalu lembab'],
    confidence: 0,
  },
  'melon': {
    crop: 'Melon',
    optimalRange: { suhu: [22, 32], kelembapan: [60, 80], ec: [1500, 2200] },
    growthDays: 90,
    tips: ['Butuh cahaya maksimal', 'Buah harus disangga', 'Sirkulasi udara penting'],
    confidence: 0,
  },
  'stroberi': {
    crop: 'Stroberi',
    optimalRange: { suhu: [15, 25], kelembapan: [65, 80], ec: [1100, 1600] },
    growthDays: 120,
    tips: ['Iklim sejuk ideal', 'Buah tidak boleh menyentuh tanah', 'Stolonisasi perlu kontrol'],
    confidence: 0,
  },
};

class MLService {
  private isInitialized = true;
  private lastPrediction: MLPredictionResult | null = null;
  private predictionCache: Map<string, MLPredictionResult> = new Map();

  async init() {
    console.log('[ML] Initializing Rule-Based Recommendation Service');
    this.isInitialized = true;
  }

  async predict(sensors: SensorData, forceRefresh = false): Promise<MLPredictionResult> {
    const cacheKey = this._getCacheKey(sensors);
    if (!forceRefresh && this.predictionCache.has(cacheKey)) {
      return this.predictionCache.get(cacheKey)!;
    }
    const result = this._predictFallback(sensors);
    this.predictionCache.set(cacheKey, result);
    this.lastPrediction = result;
    if (this.predictionCache.size > 10) {
      const firstKey = this.predictionCache.keys().next().value;
      if (firstKey) this.predictionCache.delete(firstKey);
    }
    return result;
  }

  /**
   * Prediksi berbasis aturan (rule-based)
   * Logika: Mencocokkan rentang suhu, kelembapan, dan EC
   * ke database tanaman yang tersedia.
   */
  private _predictFallback(sensors: SensorData): MLPredictionResult {
    const s = parseFloat(sensors.suhu || '');
    const h = parseFloat(sensors.kelembapan || '');
    const ec = parseFloat(sensors.ec || '');

    if (isNaN(s) || sensors.suhu === '–') {
      return this._getPendingResult();
    }

    const topCrops: CropPrediction[] = [];

    if (s >= 20 && s <= 30 && h >= 60 && h <= 80 && ec > 800) {
      // Optimal untuk sayuran daun
      topCrops.push(
        { ...CROPS_DB.selada, confidence: 95 },
        { ...CROPS_DB.bayam, confidence: 92 },
        { ...CROPS_DB.kangkung, confidence: 90 },
      );
    } else if (s > 30) {
      // Tanaman tahan panas
      topCrops.push(
        { ...CROPS_DB.cabai, confidence: 88 },
        { ...CROPS_DB.tomat, confidence: 85 },
        { ...CROPS_DB.terong, confidence: 82 },
      );
    } else if (s < 20) {
      // Tanaman iklim sejuk
      topCrops.push(
        { ...CROPS_DB.seledri, confidence: 90 },
        { ...CROPS_DB.stroberi, confidence: 88 },
        { ...CROPS_DB.selada, confidence: 85 },
      );
    } else {
      // Kondisi moderat
      topCrops.push(
        { ...CROPS_DB.pakcoy, confidence: 85 },
        { ...CROPS_DB.sawi, confidence: 83 },
        { ...CROPS_DB.kangkung, confidence: 80 },
      );
    }

    const envScore = this._calculateEnvironmentScore(s, h, ec);
    return { topCrops, environmentScore: envScore, timestamp: Date.now() };
  }

  private _calculateEnvironmentScore(suhu: number, hum: number, ec: number): number {
    let score = 100;
    if (suhu < 15 || suhu > 35) score -= 15;
    if (hum < 40 || hum > 90) score -= 15;
    if (ec < 200 || ec > 2500) score -= 10;
    return Math.max(0, score);
  }

  private _getCacheKey(sensors: SensorData): string {
    return `${sensors.suhu}_${sensors.kelembapan}_${sensors.ec}`;
  }

  private _getPendingResult(): MLPredictionResult {
    return { topCrops: [], environmentScore: 0, timestamp: Date.now() };
  }

  getLastPrediction(): MLPredictionResult | null { return this.lastPrediction; }

  getStatus() {
    return { initialized: this.isInitialized, modelLoaded: false, modelUrl: '', lastPredictionTime: this.lastPrediction?.timestamp || null };
  }

  /**
   * Prediksi tren menggunakan regresi linier sederhana
   * pada 10 data terakhir
   */
  predictTrend(history: any[]): TrendPrediction {
    if (!history || history.length < 3) {
      return { suhu: 'Stabil', kelembapan: 'Stabil', ec: 'Stabil' };
    }
    const recent = history.slice(-10);
    const calculateTrend = (key: string): 'Naik' | 'Turun' | 'Stabil' => {
      const values = recent.map(r => r[key]).filter(v => v !== null && v !== undefined) as number[];
      if (values.length < 3) return 'Stabil';
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      const n = values.length;
      for (let i = 0; i < n; i++) {
        sumX += i; sumY += values[i]; sumXY += i * values[i]; sumXX += i * i;
      }
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      if (key === 'ec' || key === 'tds') {
        if (slope > 5) return 'Naik';
        if (slope < -5) return 'Turun';
      } else {
        if (slope > 0.5) return 'Naik';
        if (slope < -0.5) return 'Turun';
      }
      return 'Stabil';
    };
    return { suhu: calculateTrend('suhu'), kelembapan: calculateTrend('kelembapan'), ec: calculateTrend('ec') };
  }

  dispose() { this.predictionCache.clear(); }
}

const mlService = new MLService();
export default mlService;
```

### 6.5 GeminiService.ts — Integrasi Google Gemini AI

```typescript
import { GEMINI_CONFIG } from '../utils/config';
import type { SensorData } from './MqttService';

export interface AIRecommendation {
  title: string;
  text: string;
  plants: Array<{ name: string; detail: string }>;
  tips: string[];
}

export async function getGeminiRecommendation(sensors: SensorData): Promise<AIRecommendation | null> {
  if (!GEMINI_CONFIG.enabled || !GEMINI_CONFIG.apiKey || GEMINI_CONFIG.apiKey === 'YOUR_GEMINI_API_KEY') {
    throw new Error('API Key Gemini belum dikonfigurasi. Silakan update di src/utils/config.ts');
  }

  const prompt = `Saya memiliki data sensor pertanian/greenhouse sebagai berikut:
Suhu Udara: ${sensors.suhu} °C
Kelembapan: ${sensors.kelembapan} %
EC: ${sensors.ec} µS/cm
TDS: ${sensors.tds} ppm
Suhu Air: ${sensors.suhuAir} °C

Tolong berikan analisis teknis singkat dan rekomendasi tanaman apa saja yang paling optimal ditanam pada kondisi spesifik tersebut, serta berikan tips perawatannya.
Penting: Berikan balasan STRICTLY dalam format JSON menggunakan struktur di bawah ini tanpa markdown code blocks tambahan:
{
  "title": "Judul Kesimpulan Singkat",
  "text": "Analisis kondisi lingkungan secara singkat (maksimal 2-3 kalimat)",
  "plants": [
    { "name": "Nama Tanaman", "detail": "Alasan singkat mengapa cocok" }
  ],
  "tips": [
    "Tip perawatan spesifik berdasarkan data di atas"
  ]
}`;

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_CONFIG.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errData = await response.text();
    throw new Error(`Gemini Error: ${errData.substring(0, 250)}`);
  }

  const data = await response.json();
  let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (resultText) {
    try {
      const jsonStr = resultText.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr) as AIRecommendation;
    } catch {
      throw new Error('Format balasan Gemini tidak valid JSON.');
    }
  }

  return null;
}
```

### 6.6 WeatherService.ts — API Cuaca Open-Meteo

```typescript
import { OPENMETEO_CONFIG } from '../utils/config';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  icon: string;
  feelsLike: number;
  uvIndex: number;
  precipitation: number;
}

const WMO_DESCRIPTIONS: Record<number, { desc: string; icon: string }> = {
  0: { desc: 'Cerah', icon: '☀️' },
  1: { desc: 'Sebagian Cerah', icon: '🌤️' },
  2: { desc: 'Berawan Sebagian', icon: '⛅' },
  3: { desc: 'Mendung', icon: '☁️' },
  45: { desc: 'Berkabut', icon: '🌫️' },
  51: { desc: 'Gerimis Ringan', icon: '🌦️' },
  61: { desc: 'Hujan Ringan', icon: '🌧️' },
  63: { desc: 'Hujan Sedang', icon: '🌧️' },
  65: { desc: 'Hujan Lebat', icon: '⛈️' },
  95: { desc: 'Badai Petir', icon: '⛈️' },
};

export async function fetchWeather(): Promise<WeatherData | null> {
  if (!OPENMETEO_CONFIG.enabled) return null;
  try {
    const { latitude, longitude, timezone } = OPENMETEO_CONFIG;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index,precipitation` +
      `&timezone=${encodeURIComponent(timezone)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API error');

    const json = await response.json();
    const c = json.current;
    const wmo = WMO_DESCRIPTIONS[c.weather_code] || { desc: 'Tidak Diketahui', icon: '🌡️' };

    return {
      temperature: Math.round(c.temperature_2m * 10) / 10,
      humidity: Math.round(c.relative_humidity_2m),
      windSpeed: Math.round(c.wind_speed_10m * 10) / 10,
      weatherCode: c.weather_code,
      description: wmo.desc,
      icon: wmo.icon,
      feelsLike: Math.round(c.apparent_temperature * 10) / 10,
      uvIndex: Math.round(c.uv_index * 10) / 10,
      precipitation: Math.round(c.precipitation * 10) / 10,
    };
  } catch (err) {
    console.warn('[WeatherService] Gagal mengambil data cuaca:', err);
    return null;
  }
}
```

---

## 7. HOOKS

### 7.1 useMqttMonitorHook.ts

```typescript
import { useState, useEffect, useRef } from 'react';
import MqttService, { SensorData, ConnectionStatus } from '../services/MqttService';
import { checkThresholds, AlertItem } from '../services/AlertService';
import DataStore from '../services/DataStore';

export const INITIAL_SENSORS: SensorData = {
  suhu: '–', kelembapan: '–', ec: '–', tds: '–', suhuAir: '–',
};

async function displayNotification(alert: AlertItem) {
  try {
    console.log('Would display notification:', alert.message);
  } catch (err) {
    console.error('Notification error:', err);
  }
}

export function useMqttMonitor() {
  const [status, setStatus] = useState<ConnectionStatus>('Menginisialisasi...');
  const [sensors, setSensors] = useState<SensorData>(INITIAL_SENSORS);
  const [lastUpdate, setLastUpdate] = useState('Belum ada data');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [historyXY, setHistoryXY] = useState({ labels: ['--:--'], suhu: [0], hum: [0] });
  const [alertCount, setAlertCount] = useState(0);
  const [isSensorOnline, setIsSensorOnline] = useState(false);
  const watchdogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    DataStore.addLog('info', 'Memulai koneksi MQTT...', 'mqtt');

    MqttService.connect(
      (data, topic) => {
        setIsSensorOnline(true);
        if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
        watchdogTimer.current = setTimeout(() => {
          setIsSensorOnline(false);
          setSensors(() => ({ suhu: '–', kelembapan: '–', ec: '–', tds: '–', suhuAir: '–' }));
        }, 8000);

        const now = new Date();
        const timeStr =
          now.getHours().toString().padStart(2, '0') + ':' +
          now.getMinutes().toString().padStart(2, '0');
        
        setLastUpdate(timeStr);

        setSensors(prev => {
          const offsets = DataStore.getOffsets();
          const appliedData = { ...data };
          if (appliedData.suhu && appliedData.suhu !== '–') appliedData.suhu = (parseFloat(appliedData.suhu) + offsets.suhu).toFixed(1);
          if (appliedData.kelembapan && appliedData.kelembapan !== '–') appliedData.kelembapan = (parseFloat(appliedData.kelembapan) + offsets.kelembapan).toFixed(1);
          if (appliedData.ec && appliedData.ec !== '–') appliedData.ec = (parseFloat(appliedData.ec) + offsets.ec).toString();
          if (appliedData.tds && appliedData.tds !== '–') appliedData.tds = (parseFloat(appliedData.tds) + offsets.tds).toString();
          if (appliedData.suhuAir && appliedData.suhuAir !== '–') appliedData.suhuAir = (parseFloat(appliedData.suhuAir) + offsets.suhuAir).toFixed(1);

          const updated = { ...prev, ...appliedData };

          // Push history
          DataStore.pushHistory({
            time: timeStr,
            suhu: updated.suhu !== '–' ? parseFloat(updated.suhu) : null,
            kelembapan: updated.kelembapan !== '–' ? parseFloat(updated.kelembapan) : null,
            ec: updated.ec !== '–' ? parseFloat(updated.ec) : null,
            tds: updated.tds !== '–' ? parseFloat(updated.tds) : null,
            suhuAir: updated.suhuAir !== '–' ? parseFloat(updated.suhuAir) : null,
          });

          // Check thresholds
          const newAlerts = checkThresholds(updated);
          if (newAlerts.length > 0) {
            setAlerts(a => [...a.slice(-4), ...newAlerts]);
            newAlerts.forEach(al => {
              DataStore.addLog(al.type === 'danger' ? 'error' : 'warning', al.message, 'alert');
              displayNotification(al);
            });
            setAlertCount(c => c + newAlerts.length);
          }
          return updated;
        });

        if (topic === 'xy' && data.suhu && data.kelembapan) {
          const offsets = DataStore.getOffsets();
          setHistoryXY(h => {
            const labels = [...h.labels, timeStr].slice(-8);
            const suhu = [...h.suhu, parseFloat(data.suhu!) + offsets.suhu].slice(-8);
            const hum = [...h.hum, parseFloat(data.kelembapan!) + offsets.kelembapan].slice(-8);
            if (labels.length < 2) {
              return { labels: ['--:--', timeStr], suhu: [0, suhu[0]], hum: [0, hum[0]] };
            }
            return { labels, suhu, hum };
          });
        }
      },
      (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'Terhubung') {
          DataStore.addLog('success', 'MQTT terhubung ke broker', 'mqtt');
        } else if (newStatus === 'Terputus') {
          DataStore.addLog('warning', 'Koneksi MQTT terputus', 'mqtt');
          setIsSensorOnline(false);
          setSensors(() => ({ suhu: '–', kelembapan: '–', ec: '–', tds: '–', suhuAir: '–' }));
        } else if (newStatus.startsWith('Gagal')) {
          DataStore.addLog('error', `MQTT: ${newStatus}`, 'mqtt');
          setIsSensorOnline(false);
          setSensors(() => ({ suhu: '–', kelembapan: '–', ec: '–', tds: '–', suhuAir: '–' }));
        }
      },
    );
    return () => {
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
      MqttService.disconnect();
    };
  }, []);

  const displayStatus = status === 'Terhubung' 
    ? (isSensorOnline ? 'Terhubung' : 'Menunggu Data...') 
    : status;

  return { status: displayStatus, sensors, lastUpdate, alerts, historyXY, alertCount, setAlertCount, setHistoryXY, setAlerts, setSensors };
}
```

---

## 8. COMPONENTS (KOMPONEN UI)

> **Catatan:** Semua komponen UI (SensorCard, AlertBanner, ConnectionStatusBar, WeatherCard, TabBar, ActuatorControl, RecommendationCard) menggunakan desain **Glassmorphism** dengan font **Outfit (Bold)** dan **Inter (Medium/Bold)**, serta mendukung **Dark Mode** dan **Light Mode** secara dinamis.

Komponen-komponen UI yang tersedia:

| Komponen | File | Fungsi |
|----------|------|--------|
| SensorCard | `src/components/SensorCard.tsx` | Menampilkan satu pembacaan sensor dengan animasi pulse, status warna, dan indikator tren |
| AlertBanner | `src/components/AlertBanner.tsx` | Banner peringatan animasi slide-in saat sensor melewati batas |
| ConnectionStatusBar | `src/components/ConnectionStatusBar.tsx` | Status koneksi MQTT dengan animasi pulse indikator |
| WeatherCard | `src/components/WeatherCard.tsx` | Kartu cuaca lokal dari Open-Meteo API |
| TabBar | `src/components/TabBar.tsx` | Navigasi tab bawah (Dashboard, Riwayat, Log, Setelan) dengan badge notifikasi |
| ActuatorControl | `src/components/ActuatorControl.tsx` | Kendali aktuator IoT (pompa, kipas, growlight) dengan jadwal otomasi |
| RecommendationCard | `src/components/RecommendationCard.tsx` | Kartu rekomendasi tanaman dari rule-based engine + tombol analisis Gemini AI |

---

## 9. SCREENS (HALAMAN)

| Screen | File | Fungsi |
|--------|------|--------|
| LoginScreen | `src/screens/LoginScreen.tsx` | Halaman login dengan animasi fade-in dan shake error |
| DashboardScreen | `src/screens/DashboardScreen.tsx` | Dashboard utama: sensor, grafik, cuaca, aktuator, rekomendasi |
| HistoryScreen | `src/screens/HistoryScreen.tsx` | Riwayat data sensor dengan tampilan statistik dan tabel |
| LogScreen | `src/screens/LogScreen.tsx` | Log aktivitas sistem dengan filter dan catatan manual |
| SettingsScreen | `src/screens/SettingsScreen.tsx` | Pengaturan: profil, koneksi, ambang batas, kalibrasi, manajemen user |

---

## 10. PYTHON BACKEND

### 10.1 train.py — Script Training Model ML

```python
"""
AgriSense ML Training Script
============================
Train TensorFlow model untuk prediksi commodity berdasarkan sensor data.
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import json
import os
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
import argparse

MODEL_DIR = Path(__file__).parent / "model"
DATA_FILE = Path(__file__).parent / "data" / "training_data.csv"
CROPS = [
    'selada', 'bayam', 'kangkung', 'sawi', 'pakcoy',
    'cabai', 'tomat', 'terong', 'kemangi', 'mentimun',
    'seledri', 'melon', 'stroberi'
]

class CropPredictionModel:
    def __init__(self, crops=CROPS):
        self.crops = crops
        self.num_classes = len(crops)
        self.model = None
        self.scaler = MinMaxScaler()
        
    def build_model(self):
        model = keras.Sequential([
            layers.Input(shape=(5,)),
            layers.Dense(64, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.2),
            layers.Dense(32, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.2),
            layers.Dense(16, activation='relu'),
            layers.Dropout(0.1),
            layers.Dense(self.num_classes, activation='softmax')
        ])
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy', keras.metrics.AUC()]
        )
        self.model = model
        
    def load_data(self, csv_path=DATA_FILE):
        if not csv_path.exists():
            return None
        df = pd.read_csv(csv_path)
        X = df[['suhu', 'kelembapan', 'ec', 'tds', 'suhuAir']].values
        y = df['crop'].values
        X_scaled = self.scaler.fit_transform(X)
        y_encoded = keras.utils.to_categorical(
            [self.crops.index(crop) for crop in y],
            num_classes=self.num_classes
        )
        return X_scaled, y_encoded
```

> **Catatan:** Script training ini disediakan untuk pengembangan lebih lanjut. Saat ini, aplikasi mobile menggunakan sistem **rule-based** (berbasis aturan) sebagai pengganti model ML karena belum tersedia dataset training.

### 10.2 data_collector.py — Flask API Pengumpul Data

Server Flask untuk mengumpulkan training data dari aplikasi mobile. Menyediakan endpoint:
- `GET /health` — Health check
- `POST /api/data/collect` — Mengumpulkan data sensor + label tanaman
- `GET /api/data/list` — Menampilkan semua data
- `GET /api/data/stats` — Statistik koleksi data
- `GET /api/data/export` — Ekspor data sebagai JSON

---

## 11. ENVIRONMENT VARIABLES

```env
# ==========================================
# AgriSense Mobile - Environment Variables
# ==========================================

# --- MQTT Configuration ---
MQTT_HOST=your.mqtt.host
MQTT_PORT=8884
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MQTT_TOPIC_XY=sensor/xy_md02
MQTT_TOPIC_BSK=sensor/bsk_ec100

# --- InfluxDB Configuration ---
INFLUX_HOST=http://your.influxdb.host:8086
INFLUX_DB=sensor_db

# --- Open-Meteo API ---
OPENMETEO_LATITUDE=-8.65
OPENMETEO_LONGITUDE=115.2167

# --- Gemini AI ---
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

## RINGKASAN TEKNOLOGI

| Kategori | Teknologi | Versi/Keterangan |
|----------|-----------|-------------------|
| Framework Mobile | React Native | 0.84.1 |
| Bahasa | TypeScript | 5.8.3 |
| UI Library | React | 19.2.3 |
| Protokol IoT | MQTT over WebSocket | paho-mqtt 1.1.0 |
| Charting | react-native-chart-kit | 6.12.0 |
| SVG | react-native-svg | 15.15.4 |
| AI/LLM | Google Gemini API | gemini-2.5-flash |
| Weather API | Open-Meteo | v1 |
| Sistem Rekomendasi | Rule-Based | Berbasis aturan (suhu, kelembapan, EC) |
| Analisis Tren | Regresi Linier Sederhana | Slope-based threshold |
| Python Backend | Flask, TensorFlow, scikit-learn | Opsional (untuk training ML) |
| Design System | Glassmorphism | Dark/Light mode, font Outfit + Inter |

---

> **Dokumen ini berisi seluruh source code inti dari aplikasi AgriSense Mobile.**
> Gunakan dokumen ini sebagai referensi untuk menyusun laporan teknis, bab implementasi, atau dokumentasi sistem.
