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
      { host, port: 8884, path: '/ws' }, // Alternate path sometimes used
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

          // Subscribe (Astro logic)
          const topics = [this.currentTopicXY, this.currentTopicBSK, 'sensor/+', 'sensor/#'];
          topics.forEach(t => t && this.client.subscribe(t));
          console.log('[MQTT] Subscribed to telemetry topics.');
        },
        onFailure: (err: any) => {
          console.error(`[MQTT] Failed on port ${variant.port}:`, err?.errorMessage);
          this.isConnected = false;
          
          // Try next variant if available (Astro fallback logic)
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
        this.currentVariantIndex = 0; // Restart from first variant
        this._doConnect();
      }
    }, 10000); // 10s wait for reconnect
  }

  private _handleMessage(message: any) {
    try {
      const topic = message.destinationName;
      const raw = message.payloadString;
      console.log(`[MQTT] Data: ${topic} => ${raw}`);

      let data: any;
      try { data = JSON.parse(raw); } catch { return; }

      // Flexible detection logic (matches Astro versions)
      const isXY = topic === this.currentTopicXY || topic.includes('xy');
      const isBSK = topic === this.currentTopicBSK || topic.includes('bsk');

      if (isXY) {
        this._handleXYData(data, topic);
      } else if (isBSK) {
        this._handleBSKData(data, topic);
      } else {
        // Auto-match by field presence
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
