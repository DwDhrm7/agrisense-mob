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

// Default Users
export const USERS: Record<string, { password: string; role: string; name: string }> = {
  admin: { password: 'admin123', role: 'admin', name: 'Administrator' },
  magang: { password: 'magang123', role: 'user', name: 'Magang' },
};

import { Appearance } from 'react-native';

export const LIGHT_COLORS = {
  // Core palette — Earthy Tone Liquid Apple
  primary: '#2D5A27', // Deep Forest Green
  primarySoft: 'rgba(45, 90, 39, 0.05)',
  primaryBorder: 'rgba(45, 90, 39, 0.15)',

  // iOS 26.0 Earthy Glass — Ultra Translucent
  background: '#F9FBF9', // Soft Sage-White
  surface: 'rgba(255, 255, 255, 0.35)', // High-transparency glass
  surfaceElevated: 'rgba(255, 255, 255, 0.55)', 
  glassBorder: 'rgba(45, 90, 39, 0.2)', // Sage Green Stroke
  glassShadow: 'rgba(45, 90, 39, 0.06)',

  // Text
  textPrimary: '#1A2F1A', // Dark Moss Text
  textSecondary: '#2D402D',
  textMuted: '#6B7A6B',
  textLight: '#A3AFA3',

  // Borders
  border: 'rgba(45, 90, 39, 0.1)',
  borderLight: 'rgba(45, 90, 39, 0.05)',

  // Status — Earthy variants
  error: '#AE445A', // Terracotta Red
  errorSoft: 'rgba(174,68,90,0.08)',
  warning: '#D89216', // Ochre Yellow
  warningSoft: 'rgba(216,146,22,0.08)',
  success: '#4E9F3D', // Leaf Green
  successSoft: 'rgba(78,159,61,0.08)',

  // Sensor accents — Earthy scheme
  suhu: '#AE445A', // Terracotta
  kelembapan: '#2D5A27', // Forest
  ec: '#4E9F3D', // Leaf
  tds: '#795548', // Brown
  suhuAir: '#5D4037', // Deep Wood
};

export const DARK_COLORS = {
  // Core palette — Earthy Dark Liquid Apple
  primary: '#D2E9E9', // Soft Mint
  primarySoft: 'rgba(210, 233, 233, 0.04)',
  primaryBorder: 'rgba(210, 233, 233, 0.12)',

  // iOS 26.0 Earthy Glass — Deep Forest Clay Background (No Black)
  background: '#151C15', // Deep Forest Green (Very Earthy)
  surface: 'rgba(255, 255, 255, 0.04)', // Ultra-translucency
  surfaceElevated: 'rgba(255, 255, 255, 0.07)',
  glassBorder: 'rgba(255, 255, 255, 0.15)', // Frosted stroke
  glassShadow: 'rgba(0, 0, 0, 0.3)',

  // Text — Muted Sage & Cream
  textPrimary: '#F2F2F2',
  textSecondary: '#EBF3EB',
  textMuted: '#8E9A8E',
  textLight: '#5D665D',

  // Borders
  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.03)',

  // Status — Earthy variants
  error: '#FF7675', // Muted Terracotta
  errorSoft: 'rgba(255,118,117,0.1)',
  warning: '#F4D03F', // Golden Sand
  warningSoft: 'rgba(244,208,63,0.1)',
  success: '#58D68D', // Soft Emerald
  successSoft: 'rgba(88,214,141,0.1)',

  // Sensor accents — Earthy scheme
  suhu: '#FF7675', // Muted Terracotta
  kelembapan: '#55E6C1', // Fresh Sage
  ec: '#58D68D', // Soft Emerald
  tds: '#E6C07B', // Clay/Sand
  suhuAir: '#95A5A6', // Dusty Slate
};

// export const COLORS = colorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

export const TYPOGRAPHY = {
  fontLight: '300',
  fontRegular: '400',
  fontMedium: '500',
  fontSemibold: '600',
  fontBold: '700',
  fontBlack: '800',
} as const;
