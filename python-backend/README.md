# AgriSense ML Training Backend

Backend Python untuk training dan eksport ML model untuk AgriSense Mobile.

## Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Structure

- **train.py** - Training script menggunakan TensorFlow/Keras
- **export_model.py** - Export model ke TensorFlow.js format
- **data_collector.py** - API untuk collect data dari mobile app
- **model/** - Output model files

## Workflow

### 1. Collect Data (Mobile → Backend)
Data dari sensor + hasil panen ditransmit dari mobile app ke backend:

```python
# POST /api/data/collect
{
  "timestamp": 1623456789,
  "sensors": {
    "suhu": 25.5,
    "kelembapan": 70,
    "ec": 1200,
    "tds": 600,
    "suhuAir": 22.5
  },
  "crop": "selada",  # Target commodity
  "outcome": "success",  # success | partial | fail
  "growthDays": 35,
  "notes": "Cocok untuk selada"
}
```

### 2. Train Model

```bash
python train.py
```

Output: `model/model.h5` (TensorFlow SavedModel format)

### 3. Export untuk TensorFlow.js

```bash
python export_model.py
```

Output:
- `model/model.json` - Model weights & structure
- `model/group1-shard*.bin` - Binary weights

### 4. Copy ke Mobile App

```bash
cp -r model/agrisense_model.json ../ios/model/
cp -r model/*.bin ../ios/model/
cp -r model/agrisense_model.json ../android/assets/model/
```

## Model Architecture

```
Input (5 sensors)
    ↓
Dense(64, relu) → Dropout(0.2)
    ↓
Dense(32, relu) → Dropout(0.2)
    ↓
Dense(13, softmax) → 13 commodities output
```

**Inputs:**
- suhu (Temperature)
- kelembapan (Humidity)
- EC (Electrical Conductivity)
- TDS (Total Dissolved Solids)
- suhuAir (Water Temperature)

**Outputs (13 crops):**
1. Selada
2. Bayam
3. Kangkung
4. Sawi
5. Pakcoy
6. Cabai
7. Tomat
8. Terong
9. Kemangi
10. Mentimun
11. Seledri
12. Melon
13. Stroberi

## Data Collection Tips

- Minimal 50-100 data points per commodity untuk akurat
- Variasikan kondisi sensor (bukan hanya ideal range)
- Rekam hasil aktual (bukan prediction)
- Tambahkan seasonal info
- Track failed crops juga (negative examples penting)

## Hyperparameters

```python
EPOCHS = 50
BATCH_SIZE = 16
VALIDATION_SPLIT = 0.2
LEARNING_RATE = 0.001
```

## Testing Model Locally

```bash
# Inference test
python -c "from model_utils import test_model; test_model()"
```

## API Endpoint (FastAPI)

Optional: Run Flask/FastAPI server untuk real-time retraining:

```python
from fastapi import FastAPI
app = FastAPI()

@app.post("/api/predict")
async def predict(sensors: SensorData):
    result = model.predict(...)
    return result

@app.post("/api/retrain")
async def retrain():
    # Trigger retraining dengan collected data
    pass
```

Jalankan: `uvicorn server:app --reload --host 0.0.0.0 --port 8000`

## Mobile Integration

Mobile app akan:
1. Load model dari bundled assets saat startup
2. Run inference lokal setiap 5 detik
3. Fallback ke Gemini API jika model error
4. Send collected data ke backend untuk retraining

---

**Next:** Mulai dari `train.py` setelah collect ≥50 data points
