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

