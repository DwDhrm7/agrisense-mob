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

  connect(onSensor: SensorCallback, onStatus: StatusCallback) {
    this.onSensorData = onSensor;
    this.onStatusChange = onStatus;
    this._doConnect();
  }

  private _doConnect() {
    try {
      const Paho = require('paho-mqtt');
      const clientId = 'agrisense-app-' + Math.random().toString(16).slice(2, 8);

      this.client = new Paho.Client(
        MQTT_CONFIG.host,
        MQTT_CONFIG.port,
        MQTT_CONFIG.path,
        clientId,
      );

      this.client.onConnectionLost = (resp: any) => {
        console.log('[MQTT] Connection lost:', resp.errorMessage);
        this.isConnected = false;
        this.onStatusChange?.('Terputus');
        this._scheduleReconnect();
      };

      this.client.onMessageArrived = (message: any) => {
        this._handleMessage(message);
      };

      this.onStatusChange?.('Menghubungkan...');

      this.client.connect({
        useSSL: MQTT_CONFIG.useSSL,
        userName: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        timeout: 10,
        keepAliveInterval: 30,
        cleanSession: true,
        onSuccess: () => {
          console.log('[MQTT] Connected successfully');
          this.isConnected = true;
          this.onStatusChange?.('Terhubung');

          // Subscribe to specific topics + wildcard (same as web)
          this.client.subscribe(MQTT_CONFIG.topicXY);
          this.client.subscribe(MQTT_CONFIG.topicBSK);
          this.client.subscribe('sensor/#');
          console.log('[MQTT] Subscribed to:', MQTT_CONFIG.topicXY, MQTT_CONFIG.topicBSK, 'sensor/#');
        },
        onFailure: (err: any) => {
          console.log('[MQTT] Connection failed:', err.errorMessage, err.errorCode);
          this.isConnected = false;
          this.onStatusChange?.(`Gagal: ${err.errorMessage || 'Timeout'}`);
          this._scheduleReconnect();
        },
      });
    } catch (e: any) {
      console.error('[MQTT] Init error:', e?.message);
      this.onStatusChange?.('Gagal: Error internal');
    }
  }

  private _scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log('[MQTT] Reconnecting...');
      this._doConnect();
    }, 5000);
  }

  private _handleMessage(message: any) {
    try {
      const topic = message.destinationName;
      const raw = message.payloadString;
      console.log('[MQTT] Message on', topic, ':', raw);

      const data = JSON.parse(raw);

      // ── Detect topic type (same logic as web version) ──
      const isXY = topic === MQTT_CONFIG.topicXY || topic.includes('xy');
      const isBSK = topic === MQTT_CONFIG.topicBSK || topic.includes('bsk');

      if (isXY) {
        this._handleXYData(data);
      } else if (isBSK) {
        this._handleBSKData(data);
      } else {
        // Auto-detect by field names (same as web version)
        if (data.suhu !== undefined || data.kelembapan !== undefined ||
            data.humidity !== undefined || data.temperature !== undefined) {
          this._handleXYData(data);
        }
        if (data.ec !== undefined || data.EC !== undefined ||
            data.tds !== undefined || data.TDS !== undefined) {
          this._handleBSKData(data);
        }
      }
    } catch (e: any) {
      console.warn('[MQTT] Parse error:', e?.message);
    }
  }

  // Handle XY-MD02 data (suhu + kelembapan)
  // Field variants: suhu|temperature|temp, kelembapan|humidity|hum
  private _handleXYData(data: any) {
    const suhu = data.suhu ?? data.temperature ?? data.temp ?? null;
    const kelembapan = data.kelembapan ?? data.humidity ?? data.hum ?? null;

    const result: Partial<SensorData> = {};
    if (suhu !== null) result.suhu = parseFloat(suhu).toFixed(1);
    if (kelembapan !== null) result.kelembapan = parseFloat(kelembapan).toFixed(1);

    if (Object.keys(result).length > 0) {
      console.log('[MQTT] XY parsed:', result);
      this.onSensorData?.(result, 'xy');
    }
  }

  // Handle BSK-EC-100 data (ec + tds + suhu air)
  // Field variants: ec|EC, tds|TDS, temperature|temp|suhu (for water temp)
  private _handleBSKData(data: any) {
    const ec = data.ec ?? data.EC ?? null;
    const tds = data.tds ?? data.TDS ?? null;
    const temp = data.temperature ?? data.temp ?? data.suhu ?? data.suhuAir ?? null;

    const result: Partial<SensorData> = {};
    if (ec !== null) result.ec = ec.toString();
    if (tds !== null) result.tds = tds.toString();
    if (temp !== null) result.suhuAir = parseFloat(temp).toFixed(1);

    if (Object.keys(result).length > 0) {
      console.log('[MQTT] BSK parsed:', result);
      this.onSensorData?.(result, 'bsk');
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    try {
      if (this.client && this.isConnected) {
        this.client.disconnect();
      }
    } catch (_) {}
    this.isConnected = false;
  }

  getConnected() {
    return this.isConnected;
  }
}

export default new MqttService();
