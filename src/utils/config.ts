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
  // Core palette — Premium Earthy Dark Liquid Apple
  primary: '#96B096', // Muted Sage (Elegant Primary)
  primarySoft: 'rgba(150, 176, 150, 0.05)',
  primaryBorder: 'rgba(150, 176, 150, 0.15)',

  // iOS 26.0 Earthy Glass — Midnight Olive Background
  background: '#0E120E', // Deep Organic Midnight (Softer than pure black)
  surface: 'rgba(255, 255, 255, 0.03)', // Subtle translucency
  surfaceElevated: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.12)', // Refined frosted stroke
  glassShadow: 'rgba(0, 0, 0, 0.45)',

  // Text — Creamy & Muted Sage
  textPrimary: '#E8EDE8', // Soft Ivory
  textSecondary: '#C5CDC5',
  textMuted: '#7D8A7D',
  textLight: '#4B544B',

  // Borders
  border: 'rgba(255, 255, 255, 0.05)',
  borderLight: 'rgba(255, 255, 255, 0.02)',

  // Status — Earthy variants (Muted)
  error: '#CF6679', // Muted Terracotta
  errorSoft: 'rgba(207, 102, 121, 0.08)',
  warning: '#F3B431', // Warm Ochre
  warningSoft: 'rgba(243, 180, 49, 0.08)',
  success: '#81B622', // Olive Green
  successSoft: 'rgba(129, 182, 34, 0.08)',

  // Sensor accents — Earthy scheme
  suhu: '#CF6679', 
  kelembapan: '#5BB381', // Muted Emerald
  ec: '#81B622',
  tds: '#A8907E', // Clay
  suhuAir: '#7B8FA1', // Steel Blue-Gray
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
