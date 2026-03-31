// ──────────────────────────────────────────────
// AgriSense · Alert / Notification Service
// ──────────────────────────────────────────────
import { SENSOR_THRESHOLDS, TELEGRAM_CONFIG } from '../utils/config';
import type { SensorData } from './MqttService';

export interface AlertItem {
  id: string;
  type: 'warning' | 'danger' | 'info';
  sensor: string;
  message: string;
  value: string;
  timestamp: Date;
}

const alertCooldowns: Record<string, number> = {};
const COOLDOWN_MS = 60_000; // 1 menit cooldown per sensor

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
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}

export async function sendTelegramAlert(message: string): Promise<boolean> {
  if (!TELEGRAM_CONFIG.enabled) return false;
  if (TELEGRAM_CONFIG.botToken === 'YOUR_TELEGRAM_BOT_TOKEN') return false;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CONFIG.chatId,
        text: `🌿 *AgriSense Alert*\n\n${message}`,
        parse_mode: 'Markdown',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
