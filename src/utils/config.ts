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
  MQTT_SSL,
  API_URL,
  ADMIN_PASSWORD,
  MAGANG_PASSWORD,
} from '@env';

export const MQTT_CONFIG = {
  host: MQTT_HOST || 'mqtt.1nva.de',
  port: Number(MQTT_PORT) || 9001,
  path: '/mqtt',
  useSSL: MQTT_SSL === 'true',
  username: MQTT_USERNAME || '',
  password: MQTT_PASSWORD || '',
  topicXY: MQTT_TOPIC_XY || 'sensor/xy-md02',
  topicBSK: MQTT_TOPIC_BSK || 'sensor/bsk-ec100',
};

export const API_CONFIG = {
  baseUrl: API_URL || 'http://45.39.198.19:8000',
  timeout: 10000,
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
  botToken: TELEGRAM_BOT_TOKEN || '',
  chatId: TELEGRAM_CHAT_ID || '',
};

export const GEMINI_CONFIG = {
  enabled: true,
  apiKey: GEMINI_API_KEY || '',
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
  admin: { password: ADMIN_PASSWORD || 'admin123', role: 'admin', name: 'Administrator' },
  magang: { password: MAGANG_PASSWORD || 'magang123', role: 'user', name: 'Magang' },
};

import { Appearance } from 'react-native';

export const LIGHT_COLORS = {
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

export const DARK_COLORS = {
  // Core palette
  primary: '#27ae60',
  primarySoft: 'rgba(39,174,96,0.15)',
  primaryBorder: 'rgba(39,174,96,0.3)',

  // Surfaces
  background: '#121212',
  surface: '#1e1e1e',
  surfaceElevated: '#2d2d2d',

  // Text
  textPrimary: '#e0e0e0',
  textSecondary: '#a0a0a0',
  textMuted: '#777777',
  textLight: '#555555',

  // Borders
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.05)',

  // Status
  error: '#e74c3c',
  errorSoft: 'rgba(231,76,60,0.15)',
  warning: '#f39c12',
  warningSoft: 'rgba(243,156,18,0.15)',
  success: '#27ae60',
  successSoft: 'rgba(39,174,96,0.15)',

  // Sensor accent colors
  suhu: '#e67e22',
  kelembapan: '#3498db',
  ec: '#27ae60',
  tds: '#d4ac0d',
  suhuAir: '#1abc9c',
};

const colorScheme = Appearance.getColorScheme();
export const COLORS = colorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

export const TYPOGRAPHY = {
  fontLight: '300',
  fontRegular: '400',
  fontMedium: '500',
  fontSemibold: '600',
  fontBold: '700',
  fontBlack: '800',
} as const;
