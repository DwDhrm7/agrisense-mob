# IoT Service Integration Guide

## Overview

Anda punya **actual IoT service** yang membaca sensor real dari greenhouse! File `main.py` Anda sudah production-ready dengan:

- ✅ Modbus sensor reading (XY-MD02 + BSK-EC-100)
- ✅ MQTT publishing ke HiveMQ Cloud
- ✅ InfluxDB storage
- ✅ Error handling

Sekarang kami integrate ini dengan **ML model training pipeline**.

## Data Flow

```
┌─────────────────────────┐
│  Raspberry Pi / Device  │
└────────────┬────────────┘
             │
    ┌────────┴────────┐
    ↓                 ↓
[Modbus]         [/dev/ttyUSB0]
    │                 │
    ├─ XY-MD02    ├─ BSK-EC100
    │ (suhu, hum) │ (ec, tds, temp)
    │             │
    └─────┬───────┘
          ↓
  ┌───────────────────┐
  │ IoT Service       │
  │ (improved)        │
  └───┬───┬───────┬───┘
      │   │       │
      ↓   ↓       ↓
    MQTT  │   Data Collector API
         ↓         ↓
     InfluxDB  Training Data CSV
                    ↓
              ┌──────────────┐
              │ ML Model     │
              │ Training     │
              └──────────────┘
```

## Files Created

### 1. `iot_service_improved.py` 
Enhanced version dari `main.py` Anda dengan:
- Class-based design
- Better error handling
- Logging system
- **Data collector integration** untuk ML training
- Metrics tracking
- Calibration support

### 2. `sensor_aggregator.py`
Utility untuk aggregate sensor data dan forward ke API (optional)

## How to Use

### Option A: Use Improved Service (RECOMMENDED)

```bash
cd python-backend/

# Copy to Raspberry Pi or your IoT device
scp iot_service_improved.py user@192.168.x.x:~/

# On IoT device:
python3 iot_service_improved.py
```

**Features:**
- Automatically sends data to MQTT
- Stores to InfluxDB
- If `data_collector.py` running → collects training data

### Option B: Keep Using main.py + Aggregator

Jika sudah production dengan `main.py` Anda, tambahkan aggregator:

```python
# Di main.py, tambahkan ini di imports:
from sensor_aggregator import SensorDataAggregator

# Initialize
aggregator = SensorDataAggregator(
    collector_url="http://localhost:5000"
)

# Di dalam loop read_sensors(), sebelum sleep:
if xy_data and bsk_data:
    aggregator.aggregate_and_send(xy_data, bsk_data)
```

## Running Complete ML Pipeline

### Terminal 1: Start IoT Service

```bash
# On Raspberry Pi / IoT Device
python3 iot_service_improved.py

# Output:
# ✓ MQTT Connected
# ✓ Modbus Connected
# ✓ All systems ready
# → MQTT [sensor/xy_md02]: {...}
```

### Terminal 2: Start Data Collector

```bash
cd python-backend/

# Start Flask API server
python3 data_collector.py

# Output:
# Starting on http://0.0.0.0:5000
# Endpoints:
#   GET  /health
#   POST /api/data/collect
#   ...
```

### Terminal 3: Set Crop & Collect Data

```bash
python3

# Python REPL:
from iot_service_improved import IoTService

service = IoTService()

# Saat mulai tanam selada:
service.set_crop("selada")

# Sistem akan otomatis collect data setiap 5 detik
# Biarkan running selama growing period

# Saat panen (misalnya 35 hari kemudian):
service.end_crop_collection(outcome="success")
```

## Data Collection Workflow

### Step 1: Start Collection

```python
from iot_service_improved import IoTService

service = IoTService()
service.set_crop("selada")  # ← Start collecting for this crop

# Service akan:
# 1. Read sensors setiap 5 detik
# 2. Send ke /api/data/collect dengan crop="selada"
# 3. Track growth_days otomatis
```

### Step 2: Monitor Collection

```bash
# Check collection stats
curl http://localhost:5000/api/data/stats

# Response:
{
  "total": 252,
  "by_crop": {"selada": 168, "bayam": 84},
  "by_outcome": {"success": 200, "partial": 52},
  "sensors": {
    "suhu": {"min": 20.5, "max": 32.1, "avg": 26.3, "count": 252},
    ...
  }
}
```

### Step 3: End Collection

```python
service.end_crop_collection(outcome="success")

# Output:
# ✓ Collection ended: selada → success
#   Samples sent: 168
#   Failed: 0
```

## Configuration

### In `iot_service_improved.py`:

```python
# ──── KONFIGURASI ────

# MQTT (sudah ada di main.py Anda)
MQTT_BROKER = "..."
MQTT_PORT = 8883
MQTT_USER = "..."
MQTT_PASS = "..."

# Modbus & InfluxDB
SERIAL_PORT = '/dev/ttyUSB0'
INFLUX_HOST = '192.168.0.135'
INFLUX_DB = 'sensor_db'

# ← NEW: Data Collector URL
DATA_COLLECTOR_URL = "http://localhost:5000"  # Backend PC
DATA_COLLECTION_ENABLED = True  # Enable/disable collection

# Sensor Calibration (optional)
SENSOR_CALIBRATION = {
    'xy': {'suhu_offset': 0, 'hum_offset': 0},
    'bsk': {'ec_offset': 0}
}
```

## Collecting Training Data

### Scenario: Growing Selada for ML Model

```
Day 0: Plant selada
├─ service.set_crop("selada")
├─ System starts collecting sensor data every 5 seconds
└─ Data stored in training_data.csv

Days 1-35: Growing period
├─ ~302,400 sensor readings (5s interval × 35 days × 1440 min)
├─ But you'll downsample to ~300 samples per day = 10,500 total
└─ All with labels: crop=selada, growthDays=1-35

Day 36: Harvest
├─ service.end_crop_collection(outcome="success")
├─ 10,500 labeled samples added to training_data.csv
└─ Ready for model training!
```

### For Multiple Crops

```python
# Week 1: Selada
service.set_crop("selada")
# ... 35 days ...
service.end_crop_collection(outcome="success")

# Week 6: Bayam
service.set_crop("bayam")
# ... 28 days ...
service.end_crop_collection(outcome="success")

# Week 10: Cabai
service.set_crop("cabai")
# ... 90 days ...
service.end_crop_collection(outcome="success")

# After 3-4 months: 1000+ labeled samples ready for retraining!
```

## Sensor Data Format

### XY-MD02 (Temperature & Humidity)
```json
{
  "suhu": 25.5,          // °C
  "kelembapan": 70.0     // %RH
}
```

### BSK-EC-100 (Conductivity)
```json
{
  "ec": 1200.0,          // µS/cm
  "tds": 600.0,          // ppm (calculated: ec/2)
  "suhuAir": 22.5        // °C
}
```

### Combined Training Data
```csv
timestamp,suhu,kelembapan,ec,tds,suhuAir,crop,outcome,growthDays,notes
2024-06-01T08:30:00,22.5,68,1200,600,21.0,selada,success,35,Optimal
```

## Troubleshooting

### Problem: "Connection refused" to Data Collector

```
Error: Failed to send to http://localhost:5000/api/data/collect

Solution:
1. Start data_collector.py first: python3 data_collector.py
2. Check backend PC is reachable: ping <backend_ip>
3. Check firewall: port 5000 should be open
```

### Problem: Modbus read failures

```
Error: ✗ Modbus read error / ✗ XY-MD02 read error

Solution:
1. Check USB cable: /dev/ttyUSB0 exists
2. Check baud rate: 9600 ✓
3. Check device_id: XY-MD02 is 2, BSK-EC100 is 1
4. Run original main.py to verify hardware works
```

### Problem: Low collection rate

```
Symptom: Only 5-10 samples per day instead of ~300

Solution:
1. Check read interval: Default is 5 seconds
2. Modify in iot_service_improved.py: time.sleep(5)
3. Reduce to 1-2 seconds for more samples
4. But: More samples = more computation during training
```

## Performance Metrics

### Sensor Reading Rate
- XY-MD02: ~50ms to read
- BSK-EC100: ~50ms to read
- Total cycle: ~5 seconds (with 4.8s sleep)

### Data Storage
- One sample ≈ 100 bytes
- 35 day crop with 5s interval = 604,800 samples = ~58MB
- Downsampled to 1 per minute = 50,400 samples = ~5MB
- CSV overhead: minimal

### ML Training Time
- 10,000 samples: ~2-3 minutes on CPU
- 50,000 samples: ~5-10 minutes
- GPU: 5-10x faster

## Integration with Mobile App

After collecting data:

```bash
cd python-backend/

# 1. Train model with collected data
python train.py

# 2. Export to TensorFlow.js
python export_model.py

# 3. Copy to mobile app
cp -r model/tfjs/* ../src/assets/model/

# 4. Rebuild app
cd ..
npm install
npm run android
```

Now your mobile app uses ML model trained on **your actual greenhouse data**! 🌱

## Next Steps

1. ✅ Run `iot_service_improved.py` on your Raspberry Pi
2. ✅ Start `data_collector.py` on backend PC
3. ✅ Call `service.set_crop("selada")` to start collection
4. ✅ Let it run for 35+ days
5. ✅ Harvest & call `service.end_crop_collection("success")`
6. ✅ Train model with collected data
7. ✅ Deploy to mobile app

---

**Questions?** Check logs with increased verbosity:
```python
import logging
logging.basicConfig(level=logging.DEBUG)  # See all events
```
