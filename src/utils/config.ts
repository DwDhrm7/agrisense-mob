// ──────────────────────────────────────────────
// AgriSense · Configuration
// ──────────────────────────────────────────────

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
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  GEMINI_API_KEY,
} from '@env';

export const MQTT_CONFIG = {
  host: MQTT_HOST || '43fb5c6796dd440693f33baa44223b55.s1.eu.hivemq.cloud',
  port: Number(MQTT_PORT) || 8884,
  path: '/mqtt',
  useSSL: true,
  username: MQTT_USERNAME || 'arthur',
  password: MQTT_PASSWORD || 'Arthur1234',
  topicXY: MQTT_TOPIC_XY || 'sensor/xy_md02',
  topicBSK: MQTT_TOPIC_BSK || 'sensor/bsk_ec100',
};

export const INFLUX_CONFIG = {
  host: INFLUX_HOST || 'http://192.168.0.79:8086',
  db: INFLUX_DB || 'sensor_db',
  interval: 5000,
};

export const OPENMETEO_CONFIG = {
  enabled: true,
  latitude: Number(OPENMETEO_LATITUDE) || -8.65,
  longitude: Number(OPENMETEO_LONGITUDE) || 115.2167,
  timezone: 'Asia/Singapore',
  city: 'Denpasar',
};

export const TELEGRAM_CONFIG = {
  enabled: true,
  botToken: TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN',
  chatId: TELEGRAM_CHAT_ID || 'YOUR_TELEGRAM_CHAT_ID',
};

export const GEMINI_CONFIG = {
  enabled: true,
  apiKey: GEMINI_API_KEY || 'AIzaSyD8p76JOaY5PKWAe3F7xk32tzxX1-o_oE0',
};

// Ambang batas sensor untuk alert
export const SENSOR_THRESHOLDS = {
  suhu: { min: 18, max: 35, unit: '°C', label: 'Suhu Udara' },
  kelembapan: { min: 40, max: 90, unit: '%RH', label: 'Kelembapan' },
  ec: { min: 200, max: 2500, unit: 'µS/cm', label: 'EC' },
  tds: { min: 100, max: 1500, unit: 'ppm', label: 'TDS' },
  suhuAir: { min: 15, max: 32, unit: '°C', label: 'Suhu Air' },
};

// Default Users
export const USERS: Record<string, { password: string; role: string; name: string }> = {
  admin: { password: 'admin123', role: 'admin', name: 'Administrator' },
  petani: { password: 'petani123', role: 'user', name: 'Petani' },
};

// ── Design Tokens ──────────────────────────────
export const COLORS = {
  // Core palette — deep greens + warm neutrals
  primary: '#1a6b3c',
  primarySoft: 'rgba(26,107,60,0.07)',
  primaryBorder: 'rgba(26,107,60,0.12)',

  // Surfaces
  background: '#f7f8f5',
  surface: '#ffffff',
  surfaceElevated: '#fafbf8',

  // Text
  textPrimary: '#0f1d0f',
  textSecondary: '#4a5d4a',
  textMuted: '#8a9b8a',
  textLight: '#b0bdb0',

  // Borders
  border: 'rgba(0,0,0,0.06)',
  borderLight: 'rgba(0,0,0,0.03)',

  // Status
  error: '#c0392b',
  errorSoft: 'rgba(192,57,43,0.06)',
  warning: '#d4810a',
  warningSoft: 'rgba(212,129,10,0.06)',
  success: '#1a6b3c',
  successSoft: 'rgba(26,107,60,0.06)',

  // Sensor accent colors — muted, refined
  suhu: '#c4621a',
  kelembapan: '#2563a8',
  ec: '#1a6b3c',
  tds: '#8b6a3e',
  suhuAir: '#0e7490',
};

export const TYPOGRAPHY = {
  fontLight: '300',
  fontRegular: '400',
  fontMedium: '500',
  fontSemibold: '600',
  fontBold: '700',
  fontBlack: '800',
} as const;
