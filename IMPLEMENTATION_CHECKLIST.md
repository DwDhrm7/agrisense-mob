# Implementation Checklist ✓

## Backend Setup (Python) ✅

- [ ] Navigate to `python-backend/` directory
- [ ] Create virtual environment: `python3 -m venv venv`
- [ ] Activate venv: `source venv/bin/activate`
- [ ] Install deps: `pip install -r requirements.txt`
- [ ] Verify training data: `data/training_data.csv` exists (45 samples)

## Model Training (Python) ✅

- [ ] Run training: `python train.py`
- [ ] Check output:
  - [ ] `model/agrisense_model/` folder created
  - [ ] `model/scaler.json` generated
  - [ ] `model/crops.json` generated
  - [ ] Model accuracy > 80%
- [ ] Training log shows:
  - [ ] Loaded 45 training samples ✓
  - [ ] Classes: 13 crops ✓
  - [ ] Loss decreasing ✓
  - [ ] Validation accuracy > 0.85 ✓

## Model Export (Python) ✅

- [ ] Run export: `python export_model.py`
- [ ] Check `model/tfjs/` contains:
  - [ ] `agrisense_model.json` (~1.5MB)
  - [ ] `group1-shard1of1.bin` (~2-3MB)
  - [ ] `scaler.json`
  - [ ] `crops.json`

## Mobile Integration (React Native) ✅

- [ ] Create directory: `src/assets/model/`
- [ ] Copy model files:
  ```bash
  cp -r python-backend/model/tfjs/* src/assets/model/
  ```
- [ ] Verify copied files:
  - [ ] `src/assets/model/agrisense_model.json`
  - [ ] `src/assets/model/group1-shard1of1.bin`
  - [ ] `src/assets/model/scaler.json`
  - [ ] `src/assets/model/crops.json`

## Dependencies Installation (Mobile) ✅

- [ ] Navigate to project root
- [ ] Install packages: `npm install`
- [ ] Verify in `package.json`:
  - [ ] `@tensorflow/tfjs: ^4.11.0` ✓
  - [ ] `@tensorflow/tfjs-react-native: ^0.8.7` ✓
  - [ ] `expo-file-system: ^15.4.5` ✓

## Code Integration (Mobile) ✅

- [ ] Review new files:
  - [ ] `src/services/MLService.ts` ✓ (420 lines)
  - [ ] `src/components/RecommendationCard.tsx` ✓ (updated)
- [ ] Verify imports in RecommendationCard:
  ```typescript
  import mlService from '../services/MLService';
  ```
- [ ] Check useEffect hooks for ML initialization

## Testing (Mobile) ✅

- [ ] Build for Android: `npm run android`
- [ ] Or build for iOS: `npm run ios`
- [ ] On device startup, check logs:
  - [ ] `[ML] Initializing TensorFlow.js` ✓
  - [ ] `[ML] Model loaded successfully` ✓
  - [ ] No error messages
- [ ] Dashboard displays:
  - [ ] Sensor data from MQTT ✓
  - [ ] Recommendation card with ML predictions ✓
  - [ ] Confidence scores (0-100%) ✓
  - [ ] Environment score ✓
- [ ] Test predictions:
  - [ ] Change sensor values
  - [ ] Predictions update in real-time
  - [ ] Confidence changes appropriately

## Verification ✅

- [ ] MLService status shows: "initialized: true, modelLoaded: true"
- [ ] Predictions appear within 100ms
- [ ] RecommendationCard shows:
  - [ ] "ML Model · 85%" badge ✓
  - [ ] Top commodity name
  - [ ] Top 3 recommendations with growth days
  - [ ] Care tips
  - [ ] "✓ Model ML siap (skor lingkungan: 75%)" indicator
- [ ] Gemini API button still works (optional enhancement)

## Performance Check ✅

- [ ] App doesn't crash on startup
- [ ] No memory leaks (check RAM usage stays stable)
- [ ] Predictions run smoothly (no UI freezes)
- [ ] Model file size: 3-5MB ✓
- [ ] Inference latency: < 100ms ✓

## Future: Data Collection (Phase 2) 📋

- [ ] Setup data collection endpoint
  ```bash
  cd python-backend/
  python data_collector.py  # Runs on http://localhost:5000
  ```
- [ ] Configure mobile app to POST sensor data
- [ ] Collect 50+ samples from greenhouse
- [ ] Format: timestamp, suhu, kelembapan, ec, tds, suhuAir, crop, outcome

## Future: Retraining (Phase 3) 📋

- [ ] Add new data to `python-backend/data/training_data.csv`
- [ ] Retrain: `python train.py --epochs 30`
- [ ] Export: `python export_model.py`
- [ ] Update model in app: `cp model/tfjs/* ../src/assets/model/`
- [ ] Rebuild app (no code changes)

## Troubleshooting

### Model not loading?
- [ ] Check file exists: `src/assets/model/agrisense_model.json`
- [ ] Check Console logs for `[ML]` messages
- [ ] Verify model path in MLService.ts matches file location
- [ ] Try deleting node_modules and reinstalling

### Predictions always "Menunggu Data Sensor"?
- [ ] Check MQTT connected
- [ ] Verify sensor values > 0
- [ ] Check `[ML] Model loaded` in logs
- [ ] MLService fallback still works (rule-based)

### App crashes after ML update?
- [ ] Clear app cache: `npm start --reset-cache`
- [ ] Verify model dimensions: 5 inputs, 13 outputs
- [ ] Check scaler.json isn't corrupted
- [ ] Retrain and re-export model

---

## Documentation Files

After implementation, refer to:

1. **QUICKSTART.md** - Quick reference (5 steps)
2. **ML_INTEGRATION_GUIDE.md** - Complete documentation
3. **python-backend/README.md** - Backend details
4. **src/services/MLService.ts** - Code comments

---

## Status: ✅ READY TO IMPLEMENT

All files created and ready to deploy!

**Next Step**: Start with Python backend setup (Step 1)
