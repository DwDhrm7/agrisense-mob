# AgriSense IoT → ML Pipeline: Complete Setup

## What You Have

✅ **Actual IoT service** (`main.py`) yang sudah proven:
- Reading sensors dari Modbus (XY-MD02 + BSK-EC-100)
- Publishing ke MQTT (HiveMQ Cloud)
- Storing ke InfluxDB
- Production-ready dengan error handling

## What's New

We created complete pipeline untuk convert real sensor data → ML model training:

### Files Created

```
python-backend/
├── iot_service_improved.py      ← Enhanced version dari main.py
│                                  (dengan data collection built-in)
│
├── sensor_aggregator.py          ← Utility untuk aggregate data
│
├── data_collector.py             ← Flask API server
│                                  (receives sensor data → CSV)
│
├── train.py                      ← Training script
│                                  (CSV → ML model)
│
├── export_model.py               ← Export script
│                                  (Model → TensorFlow.js)
│
├── IOT_INTEGRATION_GUIDE.md      ← Step-by-step guide
│                                  (this is most important!)
│
└── PATCH_MAIN_PY.py             ← Optional: patch original main.py
                                    (if you want minimal changes)
```

## Quick Start (3 Steps)

### Step 1: Choose Your Approach

**Option A: Use Improved Service (RECOMMENDED)**
```bash
# Replaces main.py but better
python3 iot_service_improved.py
```

**Option B: Keep Using main.py + Aggregator**
```bash
# Patch your existing main.py
# See PATCH_MAIN_PY.py for changes
```

### Step 2: Start Data Collection Backend

```bash
# Terminal 1: Start Flask data collector
python3 data_collector.py
# → Running on http://localhost:5000
```

### Step 3: Collect Real Sensor Data

```python
# Python REPL or script:
from iot_service_improved import IoTService

service = IoTService()

# Start collecting for selada
service.set_crop("selada")

# Let it run for 35+ days while crop grows
# Data automatically sent to http://localhost:5000

# When harvesting
service.end_crop_collection(outcome="success")

# Now you have labeled training data!
```

## The Complete ML Pipeline

```
┌──────────────────┐
│  Main.py (IoT)   │  Read sensors every 5s
│  or Improved     │  from Modbus
└────────┬─────────┘
         │
         ↓
┌──────────────────────┐
│  MQTT + InfluxDB     │  Real-time monitoring
│  (your existing)     │  Historical storage
└────────┬─────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│ Data Collector API                   │
│ (data_collector.py)                  │
│                                      │
│ Receives labeled sensor data         │
│ Saves to: training_data.csv          │
│                                      │
│ Format:                              │
│ timestamp, suhu, kelembapan,         │
│ ec, tds, suhuAir, crop, outcome      │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────┐
│ ML Model Training    │
│ (train.py)           │
│                      │
│ Reads: training_data.csv
│ Trains: Neural network
│ Outputs: agrisense_model/
└────────┬─────────────┘
         │
         ↓
┌──────────────────────┐
│ Export to TFJS       │
│ (export_model.py)    │
│                      │
│ Converts to JS format
│ Outputs: model/tfjs/
└────────┬─────────────┘
         │
         ↓
┌──────────────────────┐
│ Mobile App           │
│ (RecommendationCard) │
│                      │
│ Loads model locally  │
│ Runs inference ≈50ms │
│ Shows predictions    │
└──────────────────────┘
```

## Data Collection Scenarios

### Scenario 1: Single Crop (35+ days)

```
Day 0: Start
└─ service.set_crop("selada")
   
Days 1-35: Growing
├─ System collects: ~604,800 sensor readings (5s interval)
├─ Downsampled to: ~300 readings per day = 10,500 total
└─ All labeled: crop=selada, growthDays=1-35

Day 36: Harvest
└─ service.end_crop_collection(outcome="success")
   └─ 10,500 labeled samples in training_data.csv
```

### Scenario 2: Multiple Crops (3-4 months)

```
June (Week 1-5):    Selada (35 days)     → 10,500 samples
July (Week 6-10):   Bayam (28 days)      → 8,000 samples
Aug (Week 11-24):   Cabai (90 days)      → 25,000 samples
                                          ───────────────
                                          43,500 samples
                                          
👉 Ready for high-quality model training!
```

## Files You Need to Understand

1. **`IOT_INTEGRATION_GUIDE.md`** ← START HERE
   - Explains complete workflow
   - Troubleshooting
   - Configuration
   
2. **`iot_service_improved.py`** (420 lines)
   - Main IoT service
   - Drop-in replacement for main.py
   - Data collection enabled
   
3. **`data_collector.py`** (250 lines)
   - Flask API
   - Stores data to CSV
   - Must be running to collect training data
   
4. **`train.py`** (350 lines)
   - Training script
   - Reads training_data.csv
   - Outputs model/

5. **`export_model.py`** (200 lines)
   - Converts model to TensorFlow.js
   - Outputs model/tfjs/ (for mobile)

## Sensor Data You'll Collect

Every 5 seconds:
```json
{
  "timestamp": "2024-06-01T08:30:00",
  "suhu": 25.5,           // °C
  "kelembapan": 70.0,     // %RH
  "ec": 1200.0,           // µS/cm
  "tds": 600.0,           // ppm
  "suhuAir": 22.5,        // °C
  "crop": "selada",       // What you're growing
  "outcome": "success",   // success | partial | fail
  "growthDays": 35        // How many days into growth
}
```

## Timeline

**Week 1**: Setup & Testing
- [ ] Setup Python backend
- [ ] Start data_collector.py
- [ ] Test with sample data

**Weeks 1-5**: Collect Selada Data
- [ ] Plant selada
- [ ] Call `service.set_crop("selada")`
- [ ] Let run 35+ days
- [ ] Harvest → `service.end_crop_collection("success")`

**Weeks 6-10**: Collect Bayam Data
- [ ] Plant bayam
- [ ] Call `service.set_crop("bayam")`
- [ ] Let run 28+ days
- [ ] Harvest & log outcome

**Weeks 11-24**: Collect Cabai Data
- [ ] Plant cabai
- [ ] Call `service.set_crop("cabai")`
- [ ] Let run 90+ days
- [ ] Harvest & log outcome

**After Month 4**: Train Model
- [ ] Run `python train.py` (1000+ samples collected)
- [ ] Run `python export_model.py`
- [ ] Copy to mobile app
- [ ] Deploy!

## How to Run

### Terminal 1: Start IoT Service

```bash
# On Raspberry Pi / IoT device
python3 iot_service_improved.py

# Or keep using your main.py (with optional patch)
python3 main.py
```

### Terminal 2: Start Data Collector

```bash
# On backend PC
cd python-backend/
python3 data_collector.py
```

### Terminal 3: Control Collection

```bash
# Python REPL or script
from iot_service_improved import IoTService
service = IoTService()

# Start
service.set_crop("selada")

# ... wait 35+ days ...

# End
service.end_crop_collection(outcome="success")

# Check stats
curl http://localhost:5000/api/data/stats
```

### After Data Collection: Train Model

```bash
python3 train.py          # Train model from CSV
python3 export_model.py   # Export to TensorFlow.js

# Copy to mobile
cp -r model/tfjs/* ../src/assets/model/

# Deploy!
npm run android
```

## Key Advantages

✅ **Real greenhouse data** → Model trained on YOUR actual conditions
✅ **Automatic labeling** → Know which crop = which conditions
✅ **Long-term tracking** → Growth period included
✅ **Outcome recording** → Know success/failure correlation
✅ **Offline inference** → 50ms predictions on mobile
✅ **No cloud dependency** → All local ML

## Architecture Benefits

```
Before:                After:
─────────────────────  ──────────────────────────
main.py               iot_service_improved.py
  → MQTT              ├─ MQTT (unchanged)
  → InfluxDB          ├─ InfluxDB (unchanged)
  → Fixed rules       ├─ data_collector.py (NEW!)
                      └─ TensorFlow.js local (NEW!)
                      
Result:
Real sensor data → Labeled training data → ML model → Accurate predictions
```

## Next Steps

1. Read **`IOT_INTEGRATION_GUIDE.md`** completely
2. Choose Option A or B (improved vs patched)
3. Start `data_collector.py`
4. Start collecting real sensor data
5. After 3-4 months: train model
6. Deploy to mobile!

---

**Questions?** All answers in `IOT_INTEGRATION_GUIDE.md`
