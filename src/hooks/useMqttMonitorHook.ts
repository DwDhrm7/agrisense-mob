import { useState, useEffect, useRef } from 'react';
import MqttService, { SensorData, ConnectionStatus } from '../services/MqttService';
import { checkThresholds, AlertItem } from '../services/AlertService';
import DataStore from '../services/DataStore';
// import notifee, { AndroidImportance } from '@notifee/react-native';

export const INITIAL_SENSORS: SensorData = {
  suhu: '–', kelembapan: '–', ec: '–', tds: '–', suhuAir: '–',
};

async function displayNotification(alert: AlertItem) {
  try {
    // Notifications disabled for testing
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
          
          // Apply offsets
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

          // Log data based on topic safely
          if (topic === 'xy') {
            DataStore.addLog('success', `Suhu: ${appliedData.suhu}°C · Kelembapan: ${appliedData.kelembapan}%`, 'sensor');
          } else if (topic === 'bsk') {
            DataStore.addLog('success', `EC: ${appliedData.ec} · TDS: ${appliedData.tds} · Suhu Air: ${appliedData.suhuAir}°C`, 'sensor');
          }

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
