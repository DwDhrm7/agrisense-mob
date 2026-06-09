// ──────────────────────────────────────────────
// AgriSense · Machine Learning Service
// ──────────────────────────────────────────────
// TensorFlow.js model inference for crop recommendations
// Backend training: Python (separate device)
// ──────────────────────────────────────────────

import * as tf from '@tensorflow/tfjs';
import type { SensorData } from './MqttService';

// Model prediction output
export interface CropPrediction {
  crop: string;
  confidence: number; // 0-100
  optimalRange: {
    suhu: [number, number];
    kelembapan: [number, number];
    ec: [number, number];
  };
  growthDays: number;
  tips: string[];
}

export interface MLPredictionResult {
  topCrops: CropPrediction[];
  environmentScore: number; // Overall suitability 0-100
  timestamp: number;
}

export interface TrendPrediction {
  suhu: 'Naik' | 'Turun' | 'Stabil';
  kelembapan: 'Naik' | 'Turun' | 'Stabil';
  ec: 'Naik' | 'Turun' | 'Stabil';
}

// Commodity database with metadata
const CROPS_DB: Record<string, CropPrediction> = {
  'selada': {
    crop: 'Selada (Lettuce)',
    optimalRange: { suhu: [15, 25], kelembapan: [60, 80], ec: [800, 1500] },
    growthDays: 35,
    tips: ['Jaga pH air 5.5-6.5', 'Pastikan sirkulasi udara baik', 'Hindari genangan air'],
    confidence: 0,
  },
  'bayam': {
    crop: 'Bayam (Spinach)',
    optimalRange: { suhu: [16, 28], kelembapan: [55, 75], ec: [900, 1400] },
    growthDays: 28,
    tips: ['Tumbuh cepat di kelembapan tinggi', 'Cahaya moderat cukup', 'Panen rutin untuk trigger pertumbuhan'],
    confidence: 0,
  },
  'kangkung': {
    crop: 'Kangkung',
    optimalRange: { suhu: [20, 30], kelembapan: [60, 85], ec: [1000, 1600] },
    growthDays: 25,
    tips: ['Sangat cocok hidroponik', 'Toleran terhadap penyakit', 'Air mengalir diperlukan'],
    confidence: 0,
  },
  'sawi': {
    crop: 'Sawi (Mustard Greens)',
    optimalRange: { suhu: [20, 32], kelembapan: [50, 80], ec: [1100, 1700] },
    growthDays: 32,
    tips: ['Tahan panas ringan', 'Butuh nitrogen cukup', 'Siram konsisten'],
    confidence: 0,
  },
  'pakcoy': {
    crop: 'Pakcoy',
    optimalRange: { suhu: [18, 28], kelembapan: [55, 80], ec: [1000, 1500] },
    growthDays: 28,
    tips: ['EC ideal 1000-1500 µS/cm', 'Hindari gelang boron', 'Panen saat daun 4-5 helai'],
    confidence: 0,
  },
  'cabai': {
    crop: 'Cabai Rawit',
    optimalRange: { suhu: [25, 35], kelembapan: [60, 80], ec: [1400, 2000] },
    growthDays: 90,
    tips: ['Optimal di suhu tinggi', 'Butuh cahaya penuh', 'Panen berkala meningkatkan produksi'],
    confidence: 0,
  },
  'tomat': {
    crop: 'Tomat Cherry',
    optimalRange: { suhu: [24, 32], kelembapan: [65, 80], ec: [1500, 2100] },
    growthDays: 60,
    tips: ['Produktivitas tinggi pada suhu hangat', 'Pemangkasan rutin perlu', 'Dukung dengan ajir'],
    confidence: 0,
  },
  'terong': {
    crop: 'Terong',
    optimalRange: { suhu: [25, 35], kelembapan: [60, 75], ec: [1300, 1900] },
    growthDays: 70,
    tips: ['Menyukai 25-35°C', 'Cahaya penuh dibutuhkan', 'Olah tanah dalam sebelum tanam'],
    confidence: 0,
  },
  'kemangi': {
    crop: 'Kemangi',
    optimalRange: { suhu: [25, 35], kelembapan: [50, 75], ec: [1000, 1500] },
    growthDays: 30,
    tips: ['Aroma terbaik pada suhu hangat', 'Panen daun rutin dari atas', 'Cegah bunga untuk hasil panjang'],
    confidence: 0,
  },
  'mentimun': {
    crop: 'Mentimun',
    optimalRange: { suhu: [20, 32], kelembapan: [65, 85], ec: [1200, 1800] },
    growthDays: 45,
    tips: ['Tumbuh cepat di suhu hangat', 'Butuh air cukup', 'Ajir/trelis diperlukan'],
    confidence: 0,
  },
  'seledri': {
    crop: 'Seledri',
    optimalRange: { suhu: [15, 25], kelembapan: [65, 80], ec: [1100, 1600] },
    growthDays: 70,
    tips: ['Tahan iklim sejuk', 'Pencahayaan moderat', 'Tanah harus selalu lembab'],
    confidence: 0,
  },
  'melon': {
    crop: 'Melon',
    optimalRange: { suhu: [22, 32], kelembapan: [60, 80], ec: [1500, 2200] },
    growthDays: 90,
    tips: ['Butuh cahaya maksimal', 'Buah harus disangga', 'Sirkulasi udara penting'],
    confidence: 0,
  },
  'stroberi': {
    crop: 'Stroberi',
    optimalRange: { suhu: [15, 25], kelembapan: [65, 80], ec: [1100, 1600] },
    growthDays: 120,
    tips: ['Iklim sejuk ideal', 'Buah tidak boleh menyentuh tanah', 'Stolonisasi perlu kontrol'],
    confidence: 0,
  },
};

class MLService {
  private model: tf.GraphModel | null = null;
  private modelUrl: string = '';
  private isInitialized = false;
  private lastPrediction: MLPredictionResult | null = null;
  private predictionCache: Map<string, MLPredictionResult> = new Map();

  /**
   * Initialize ML service with model URL
   * Default: uses bundled model or backend URL
   */
  async init(modelUrl?: string) {
    try {
      // Default to bundled model in assets
      this.modelUrl = modelUrl || 'file:///model/agrisense_model.json';
      
      console.log('[ML] Initializing TensorFlow.js');
      await tf.ready();

      console.log(`[ML] Loading model from: ${this.modelUrl}`);
      try {
        this.model = await tf.loadGraphModel(this.modelUrl);
        this.isInitialized = true;
        console.log('[ML] Model loaded successfully');
      } catch (loadError) {
        console.warn(`[ML] Failed to load from ${this.modelUrl}`, loadError);
        console.log('[ML] Will use fallback rule-based predictions');
        this.isInitialized = true; // Allow fallback mode
      }
    } catch (error) {
      console.error('[ML] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Predict crop suitability from sensor data
   */
  async predict(sensors: SensorData, forceRefresh = false): Promise<MLPredictionResult> {
    // Check cache
    const cacheKey = this._getCacheKey(sensors);
    if (!forceRefresh && this.predictionCache.has(cacheKey)) {
      return this.predictionCache.get(cacheKey)!;
    }

    let result: MLPredictionResult;

    if (this.model && this.isInitialized) {
      result = this._predictWithModel(sensors);
    } else {
      result = this._predictFallback(sensors);
    }

    this.predictionCache.set(cacheKey, result);
    this.lastPrediction = result;

    // Limit cache to 10 entries
    if (this.predictionCache.size > 10) {
      const firstKey = this.predictionCache.keys().next().value;
      if (firstKey) {
        this.predictionCache.delete(firstKey);
      }
    }

    return result;
  }

  /**
   * Predict using TensorFlow model
   */
  private _predictWithModel(sensors: SensorData): MLPredictionResult {
    try {
      const s = parseFloat(sensors.suhu || '');
      const h = parseFloat(sensors.kelembapan || '');
      const ec = parseFloat(sensors.ec || '');
      const tds = parseFloat(sensors.tds || '');
      const waterTemp = parseFloat(sensors.suhuAir || '');

      if (isNaN(s) || isNaN(h) || isNaN(ec)) {
        return this._getPendingResult();
      }

      // Normalize inputs (0-1 range based on typical greenhouse conditions)
      const normalized = tf.tensor2d([[
        s / 40,           // suhu: 0-40°C
        h / 100,          // kelembapan: 0-100%
        ec / 2000,        // ec: 0-2000 µS/cm
        tds / 1500,       // tds: 0-1500 ppm
        waterTemp / 50    // suhuAir: 0-50°C
      ]]);

      // Run prediction
      const predictions = this.model!.predict(normalized) as tf.Tensor;
      const confidences = predictions.dataSync();

      // Get top 3 predictions
      const indices = Array.from(confidences)
        .map((conf, idx) => ({ conf, idx }))
        .sort((a, b) => b.conf - a.conf)
        .slice(0, 3);

      const topCrops = this._mapIndicesToCrops(indices);

      // Calculate environment score
      const envScore = this._calculateEnvironmentScore(s, h, ec);

      normalized.dispose();
      predictions.dispose();

      return {
        topCrops,
        environmentScore: envScore,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[ML] Prediction error:', error);
      return this._predictFallback(sensors);
    }
  }

  /**
   * Fallback: Rule-based prediction (when model unavailable)
   */
  private _predictFallback(sensors: SensorData): MLPredictionResult {
    const s = parseFloat(sensors.suhu || '');
    const h = parseFloat(sensors.kelembapan || '');
    const ec = parseFloat(sensors.ec || '');

    if (isNaN(s) || sensors.suhu === '–') {
      return this._getPendingResult();
    }

    const topCrops: CropPrediction[] = [];

    // Rule-based logic
    if (s >= 20 && s <= 30 && h >= 60 && h <= 80 && ec > 800) {
      // Optimal for leafy greens
      topCrops.push(
        { ...CROPS_DB.selada, confidence: 95 } as CropPrediction,
        { ...CROPS_DB.bayam, confidence: 92 } as CropPrediction,
        { ...CROPS_DB.kangkung, confidence: 90 } as CropPrediction,
      );
    } else if (s > 30) {
      // Hot-tolerant crops
      topCrops.push(
        { ...CROPS_DB.cabai, confidence: 88 } as CropPrediction,
        { ...CROPS_DB.tomat, confidence: 85 } as CropPrediction,
        { ...CROPS_DB.terong, confidence: 82 } as CropPrediction,
      );
    } else if (s < 20) {
      // Cool-weather crops
      topCrops.push(
        { ...CROPS_DB.seledri, confidence: 90 } as CropPrediction,
        { ...CROPS_DB.stroberi, confidence: 88 } as CropPrediction,
        { ...CROPS_DB.selada, confidence: 85 } as CropPrediction,
      );
    } else {
      // Moderate conditions
      topCrops.push(
        { ...CROPS_DB.pakcoy, confidence: 85 } as CropPrediction,
        { ...CROPS_DB.sawi, confidence: 83 } as CropPrediction,
        { ...CROPS_DB.kangkung, confidence: 80 } as CropPrediction,
      );
    }

    const envScore = this._calculateEnvironmentScore(s, h, ec);

    return {
      topCrops,
      environmentScore: envScore,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate overall environment suitability (0-100)
   */
  private _calculateEnvironmentScore(suhu: number, hum: number, ec: number): number {
    let score = 100;

    // Penalize out-of-range values
    if (suhu < 15 || suhu > 35) score -= 15;
    if (hum < 40 || hum > 90) score -= 15;
    if (ec < 200 || ec > 2500) score -= 10;

    return Math.max(0, score);
  }

  /**
   * Map model output indices to crop database
   */
  private _mapIndicesToCrops(
    indices: Array<{ conf: number; idx: number }>
  ): CropPrediction[] {
    const cropKeys = Object.keys(CROPS_DB);
    return indices.map(({ conf, idx }) => {
      const cropKey = cropKeys[idx % cropKeys.length];
      return {
        ...(CROPS_DB[cropKey] || CROPS_DB.kangkung),
        confidence: Math.round(conf * 100),
      } as CropPrediction;
    });
  }

  /**
   * Get cache key from sensor data
   */
  private _getCacheKey(sensors: SensorData): string {
    return `${sensors.suhu}_${sensors.kelembapan}_${sensors.ec}`;
  }

  /**
   * Pending prediction (when sensor data not ready)
   */
  private _getPendingResult(): MLPredictionResult {
    return {
      topCrops: [],
      environmentScore: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Get last prediction
   */
  getLastPrediction(): MLPredictionResult | null {
    return this.lastPrediction;
  }

  /**
   * Get model status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      modelLoaded: this.model !== null,
      modelUrl: this.modelUrl,
      lastPredictionTime: this.lastPrediction?.timestamp || null,
    };
  }

  /**
   * Predict environmental trends based on history
   */
  predictTrend(history: any[]): TrendPrediction {
    if (!history || history.length < 3) {
      return { suhu: 'Stabil', kelembapan: 'Stabil', ec: 'Stabil' };
    }

    // Get the last 10 entries for trend analysis
    const recent = history.slice(-10);

    const calculateTrend = (key: string): 'Naik' | 'Turun' | 'Stabil' => {
      const values = recent.map(r => r[key]).filter(v => v !== null && v !== undefined) as number[];
      if (values.length < 3) return 'Stabil';

      // Simple linear regression (slope)
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      const n = values.length;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumXX += i * i;
      }
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

      // Define thresholds for trend
      if (key === 'ec' || key === 'tds') {
        if (slope > 5) return 'Naik';
        if (slope < -5) return 'Turun';
      } else {
        if (slope > 0.5) return 'Naik';
        if (slope < -0.5) return 'Turun';
      }
      return 'Stabil';
    };

    return {
      suhu: calculateTrend('suhu'),
      kelembapan: calculateTrend('kelembapan'),
      ec: calculateTrend('ec'),
    };
  }

  /**
   * Dispose model and free resources
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.predictionCache.clear();
  }
}

// Singleton instance
const mlService = new MLService();

export default mlService;
