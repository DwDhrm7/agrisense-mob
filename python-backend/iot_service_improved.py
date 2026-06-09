"""
AgriSense IoT Service - IMPROVED
=================================
Integrated dengan data collection untuk ML model training.
Membaca sensor via Modbus + forward ke MQTT, InfluxDB, dan Data Collector API.
"""

import time
import json
import ssl
import sys
import logging
from datetime import datetime
from typing import Dict, Optional
from paho.mqtt import client as mqtt_client
from paho.mqtt.enums import CallbackAPIVersion
from pymodbus.client import ModbusSerialClient
from influxdb import InfluxDBClient
import requests

# ──── SETUP LOGGING ────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ──── KONFIGURASI HIVEMQ CLOUD ────
MQTT_BROKER = "43fb5c6796dd440693f3baa44223b55.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "arthur"
MQTT_PASS = "Arthur1234"
CLIENT_ID = "Gusalit_RaspberryPi_IoT"
MQTT_TOPICS = {
    "xy": "sensor/xy_md02",
    "bsk": "sensor/bsk_ec100"
}

# ──── KONFIGURASI MODBUS & INFLUX ────
SERIAL_PORT = '/dev/ttyUSB0'
BAUDRATE = 9600
INFLUX_HOST = '192.168.0.135'
INFLUX_DB = 'sensor_db'

# ──── KONFIGURASI DATA COLLECTOR (untuk ML training) ────
DATA_COLLECTOR_URL = "http://localhost:5000"  # Running data_collector.py
DATA_COLLECTION_ENABLED = True  # Set False jika tidak ada backend

# ──── SENSOR CALIBRATION (optional) ────
SENSOR_CALIBRATION = {
    'xy': {'suhu_offset': 0, 'hum_offset': 0},
    'bsk': {'ec_offset': 0}
}

class IoTService:
    """Unified IoT service untuk sensor reading & data forwarding"""
    
    def __init__(self):
        self.influx_client = InfluxDBClient(
            host=INFLUX_HOST,
            port=8086,
            database=INFLUX_DB
        )
        self.mqtt_client = None
        self.modbus_client = None
        
        # Data collection state
        self.current_crop = None
        self.collection_session_start = None
        self.total_samples_sent = 0
        self.failed_sends = 0
        
        # Metrics
        self.metrics = {
            'xy_reads': 0,
            'bsk_reads': 0,
            'mqtt_publishes': 0,
            'influx_writes': 0,
            'api_sends': 0
        }
    
    def setup_mqtt(self) -> bool:
        """Initialize MQTT client"""
        try:
            def on_connect(client, userdata, flags, rc, properties=None):
                if rc == 0:
                    logger.info("✓ MQTT Connected")
                else:
                    logger.error(f"✗ MQTT Connection failed: {rc}")
            
            def on_publish(client, userdata, mid, rc, properties=None):
                pass  # Silent
            
            self.mqtt_client = mqtt_client.Client(
                callback_api_version=CallbackAPIVersion.VERSION2,
                client_id=CLIENT_ID
            )
            self.mqtt_client.username_pw_set(MQTT_USER, MQTT_PASS)
            self.mqtt_client.tls_set(
                cert_reqs=ssl.CERT_REQUIRED,
                tls_version=ssl.PROTOCOL_TLSv1_2
            )
            self.mqtt_client.on_connect = on_connect
            self.mqtt_client.on_publish = on_publish
            self.mqtt_client.connect(MQTT_BROKER, MQTT_PORT)
            self.mqtt_client.loop_start()
            return True
        except Exception as e:
            logger.error(f"✗ MQTT setup failed: {e}")
            return False
    
    def setup_modbus(self) -> bool:
        """Initialize Modbus client"""
        try:
            self.modbus_client = ModbusSerialClient(
                port=SERIAL_PORT,
                baudrate=BAUDRATE,
                timeout=1,
                parity='N',
                stopbits=1,
                bytesize=8
            )
            if self.modbus_client.connect():
                logger.info("✓ Modbus Connected")
                return True
            else:
                logger.error("✗ Modbus connection failed")
                return False
        except Exception as e:
            logger.error(f"✗ Modbus setup failed: {e}")
            return False
    
    def read_xy_md02(self) -> Optional[Dict]:
        """Read XY-MD02 sensor (Suhu & Kelembapan)"""
        try:
            res = self.modbus_client.read_input_registers(
                address=1,
                count=2,
                device_id=2
            )
            
            if not res.isError():
                regs = res.registers
                data = {
                    "suhu": round(regs[0] / 10.0, 2),
                    "kelembapan": round(regs[1] / 10.0, 2)
                }
                
                # Apply calibration
                data['suhu'] += SENSOR_CALIBRATION['xy']['suhu_offset']
                data['kelembapan'] += SENSOR_CALIBRATION['xy']['hum_offset']
                
                self.metrics['xy_reads'] += 1
                logger.debug(f"XY-MD02: {data}")
                return data
            else:
                logger.warning("✗ XY-MD02 read error")
                return None
        except Exception as e:
            logger.error(f"✗ XY-MD02 exception: {e}")
            return None
    
    def read_bsk_ec100(self) -> Optional[Dict]:
        """Read BSK-EC-100 sensor (EC & Temperature)"""
        try:
            res = self.modbus_client.read_holding_registers(
                address=0,
                count=2,
                device_id=1
            )
            
            if not res.isError():
                regs = res.registers
                ec_raw = regs[0] / 10.0
                data = {
                    "ec": round(ec_raw + SENSOR_CALIBRATION['bsk']['ec_offset'], 2),
                    "tds": round(ec_raw / 2.0, 2),  # TDS ≈ EC/2
                    "suhuAir": round(regs[1] / 10.0, 2)
                }
                
                self.metrics['bsk_reads'] += 1
                logger.debug(f"BSK-EC100: {data}")
                return data
            else:
                logger.warning("✗ BSK-EC100 read error")
                return None
        except Exception as e:
            logger.error(f"✗ BSK-EC100 exception: {e}")
            return None
    
    def publish_mqtt(self, topic: str, data: Dict) -> bool:
        """Publish data ke MQTT topic"""
        try:
            if self.mqtt_client:
                self.mqtt_client.publish(
                    topic,
                    json.dumps(data),
                    qos=1
                )
                self.metrics['mqtt_publishes'] += 1
                logger.info(f"→ MQTT [{topic}]: {data}")
                return True
        except Exception as e:
            logger.error(f"✗ MQTT publish failed: {e}")
        return False
    
    def write_influxdb(self, measurement: str, data: Dict) -> bool:
        """Write data ke InfluxDB"""
        try:
            if self.influx_client:
                point = {
                    "measurement": measurement,
                    "fields": data,
                    "time": datetime.utcnow()
                }
                self.influx_client.write_points([point])
                self.metrics['influx_writes'] += 1
                logger.debug(f"→ InfluxDB [{measurement}]: {data}")
                return True
        except Exception as e:
            logger.error(f"✗ InfluxDB write failed: {e}")
        return False
    
    def send_to_data_collector(self, 
                              xy_data: Dict,
                              bsk_data: Dict) -> bool:
        """Send data ke ML training data collector"""
        if not DATA_COLLECTION_ENABLED or not self.current_crop:
            return False
        
        try:
            payload = {
                "sensors": {
                    "suhu": xy_data.get('suhu'),
                    "kelembapan": xy_data.get('kelembapan'),
                    "ec": bsk_data.get('ec'),
                    "tds": bsk_data.get('tds'),
                    "suhuAir": bsk_data.get('suhuAir')
                },
                "crop": self.current_crop
            }
            
            # Add growth days if tracking
            if self.collection_session_start:
                elapsed = time.time() - self.collection_session_start
                growth_days = int(elapsed / 86400)
                payload["growthDays"] = growth_days
            
            response = requests.post(
                f"{DATA_COLLECTOR_URL}/api/data/collect",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 201:
                self.total_samples_sent += 1
                self.metrics['api_sends'] += 1
                logger.info(f"→ API: Data collected for {self.current_crop}")
                return True
            else:
                self.failed_sends += 1
                logger.warning(f"✗ API error {response.status_code}")
                return False
                
        except Exception as e:
            self.failed_sends += 1
            logger.error(f"✗ API send failed: {e}")
            return False
    
    def set_crop(self, crop_name: str):
        """Set current crop untuk data collection"""
        self.current_crop = crop_name
        self.collection_session_start = time.time()
        self.total_samples_sent = 0
        self.failed_sends = 0
        logger.info(f"📍 Collection session started for: {crop_name}")
    
    def end_crop_collection(self, outcome: str = "unknown"):
        """End data collection session"""
        if self.current_crop:
            logger.info(f"✓ Collection ended: {self.current_crop} → {outcome}")
            logger.info(f"  Samples sent: {self.total_samples_sent}")
            logger.info(f"  Failed: {self.failed_sends}")
            self.current_crop = None
    
    def print_metrics(self):
        """Print collection metrics"""
        logger.info("=" * 50)
        logger.info("METRICS:")
        for key, val in self.metrics.items():
            logger.info(f"  {key}: {val}")
        logger.info(f"  Current crop: {self.current_crop or 'None'}")
        logger.info(f"  Total samples: {self.total_samples_sent}")
        logger.info("=" * 50)
    
    def run(self):
        """Main service loop"""
        logger.info("🚀 Starting IoT Service...")
        
        if not self.setup_mqtt():
            logger.error("MQTT setup failed. Exiting.")
            return
        
        if not self.setup_modbus():
            logger.error("Modbus setup failed. Exiting.")
            return
        
        time.sleep(1)  # Wait for connections
        
        logger.info("✓ All systems ready. Starting sensor read loop...")
        
        try:
            # For testing: automatically start collection
            # Uncomment to test ML data collection
            # self.set_crop("selada")
            
            while True:
                # Read sensors
                xy_data = self.read_xy_md02()
                time.sleep(0.5)
                bsk_data = self.read_bsk_ec100()
                
                if xy_data and bsk_data:
                    # Merge data
                    combined = {**xy_data, **bsk_data}
                    
                    # Publish to MQTT
                    self.publish_mqtt(MQTT_TOPICS['xy'], xy_data)
                    self.publish_mqtt(MQTT_TOPICS['bsk'], bsk_data)
                    
                    # Write to InfluxDB
                    self.write_influxdb("sensor_suhu_kelembapan", xy_data)
                    self.write_influxdb("sensor_ec_tds", bsk_data)
                    
                    # Send to ML data collector (if crop is set)
                    self.send_to_data_collector(xy_data, bsk_data)
                    
                    logger.info(f"✓ Cycle complete: {combined}")
                else:
                    logger.warning("⚠ Incomplete sensor reading, retrying...")
                
                time.sleep(5)  # Read interval
                
        except KeyboardInterrupt:
            logger.info("\n⏹ Shutting down...")
            self.print_metrics()
        except Exception as e:
            logger.error(f"✗ Unexpected error: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Cleanup resources"""
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
        if self.modbus_client:
            self.modbus_client.close()
        logger.info("✓ Cleanup complete")


if __name__ == "__main__":
    service = IoTService()
    service.run()
