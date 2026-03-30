import { useState, useEffect, useRef } from 'react';
import MqttService, { SensorData, ConnectionStatus } from '../services/MqttService';
import { checkThresholds, AlertItem, sendTelegramAlert } from '../services/AlertService';
import DataStore from '../services/DataStore';

export const INITIAL_SENSORS: SensorData = {
  suhu: '–', kelembapan: '–', ec: '–', tds: '–', suhuAir: '–',
};

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
          const updated = { ...prev, ...data };

          // Push history
          DataStore.pushHistory({
            time: timeStr,
            suhu: updated.suhu !== '–' ? parseFloat(updated.suhu) : null,
            kelembapan: updated.kelembapan !== '–' ? parseFloat(updated.kelembapan) : null,
            ec: updated.ec !== '–' ? parseFloat(updated.ec) : null,
            tds: updated.tds !== '–' ? parseFloat(updated.tds) : null,
            suhuAir: updated.suhuAir !== '–' ? parseFloat(updated.suhuAir) : null,
          });

          // Log data based on topic safely
          if (topic === 'xy') {
            DataStore.addLog('success', `Suhu: ${data.suhu}°C · Kelembapan: ${data.kelembapan}%`, 'sensor');
          } else if (topic === 'bsk') {
            DataStore.addLog('success', `EC: ${data.ec} · TDS: ${data.tds} · Suhu Air: ${data.suhuAir}°C`, 'sensor');
          }

          // Check thresholds
          const newAlerts = checkThresholds(updated);
          if (newAlerts.length > 0) {
            setAlerts(a => [...a.slice(-4), ...newAlerts]);
            newAlerts.forEach(al => {
              DataStore.addLog(al.type === 'danger' ? 'error' : 'warning', al.message, 'alert');
              sendTelegramAlert(`Peringatan BSK/XY:\n${al.message}`);
            });
            setAlertCount(c => c + newAlerts.length);
          }
          return updated;
        });

        if (topic === 'xy' && data.suhu && data.kelembapan) {
          setHistoryXY(h => {
            const labels = [...h.labels, timeStr].slice(-8);
            const suhu = [...h.suhu, parseFloat(data.suhu!)].slice(-8);
            const hum = [...h.hum, parseFloat(data.kelembapan!)].slice(-8);
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
