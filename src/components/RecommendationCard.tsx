import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../utils/theme';
import type { SensorData } from '../services/MqttService';
import { getGeminiRecommendation, type AIRecommendation } from '../services/GeminiService';
import mlService, { type CropPrediction, type MLPredictionResult } from '../services/MLService';

interface Recommendation {
  title: string;
  text: string;
  plants: Array<{ name: string; detail: string }>;
  tips: string[];
  confidence: string;
  accentColor: string;
  source: 'ml' | 'fallback' | 'ai';
}

interface RecommendationCardProps {
  sensors: SensorData;
}

function getRecommendationFromML(prediction: CropPrediction[], envScore: number, COLORS: any): Recommendation {
  if (!prediction || prediction.length === 0) {
    return {
      title: 'Menunggu Data Sensor',
      text: 'Sistem sedang mengumpulkan pembacaan lingkungan untuk memberikan rekomendasi yang akurat.',
      plants: [],
      tips: [],
      confidence: '–',
      accentColor: COLORS.textLight,
      source: 'fallback',
    };
  }

  const topCrop = prediction[0];
  const confidence = Math.round(topCrop.confidence);

  return {
    title: `${confidence >= 80 ? 'Sangat Direkomendasikan' : 'Direkomendasikan'}: ${topCrop.crop}`,
    text: `Skor lingkungan: ${envScore}%. Berdasarkan kondisi sensor saat ini (suhu, kelembapan, EC, TDS, suhu air), model ML memprediksi ${topCrop.crop} sebagai tanaman optimal untuk ditanam.`,
    plants: prediction.map((crop) => ({
      name: crop.crop,
      detail: `Confidence: ${Math.round(crop.confidence)}% · Panen: ${crop.growthDays} hari`
    })),
    tips: topCrop.tips,
    confidence: `ML Model · ${confidence}%`,
    accentColor: confidence >= 80 ? COLORS.success : (confidence >= 60 ? COLORS.warning : COLORS.error),
    source: 'ml',
  };
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ sensors }) => {
  const COLORS = useTheme();
  const styles = getStyles(COLORS);

  const [mlLoading, setMlLoading] = useState(true);
  const [mlPrediction, setMlPrediction] = useState<MLPredictionResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRec, setAiRec] = useState<AIRecommendation | null>(null);

  // Initialize ML service on mount
  useEffect(() => {
    const initML = async () => {
      try {
        if (!mlService.getStatus().initialized) {
          await mlService.init();
        }
        setMlLoading(false);
      } catch (error) {
        console.error('[RecommendationCard] ML init error:', error);
        setMlLoading(false);
      }
    };
    initML();

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Update ML predictions when sensors change
  useEffect(() => {
    const updatePredictions = async () => {
      try {
        if (!sensors.suhu || sensors.suhu === '–') {
          setMlPrediction(null);
          return;
        }

        const prediction = await mlService.predict(sensors);
        setMlPrediction(prediction);
      } catch (error) {
        console.warn('[RecommendationCard] Prediction error:', error);
      }
    };

    updatePredictions();
  }, [sensors]);

  const fetchAI = async () => {
    try {
      setLoadingAI(true);
      const res = await getGeminiRecommendation(sensors);
      if (res) {
        setAiRec(res);
      }
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan saat memanggil AI.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Determine which recommendation to show
  let rec: Recommendation;
  if (aiRec) {
    rec = { ...aiRec, confidence: '✨ Gemini AI', accentColor: COLORS.primary, source: 'ai' };
  } else if (mlPrediction && mlPrediction.topCrops.length > 0) {
    rec = getRecommendationFromML(mlPrediction.topCrops, mlPrediction.environmentScore, COLORS);
  } else {
    rec = {
      title: mlLoading ? 'Inisialisasi Model ML' : 'Menunggu Data Sensor',
      text: mlLoading
        ? 'Sistem sedang memuat model machine learning...'
        : 'Sistem sedang mengumpulkan pembacaan lingkungan untuk memberikan rekomendasi yang akurat.',
      plants: [],
      tips: [],
      confidence: '–',
      accentColor: COLORS.textLight,
      source: 'fallback',
    };
  }

  return (
    <View style={styles.container}>
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: rec.accentColor }]} />

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{rec.title}</Text>
        </View>
        <View style={styles.headerMeta}>
          {rec.confidence !== '–' && (
            <View style={[styles.badge, { borderColor: rec.accentColor + '30' }]}>
              <Text style={[styles.badgeText, { color: rec.accentColor }]}>
                {rec.confidence}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.description}>{rec.text}</Text>

      {/* Plants */}
      {rec.plants.length > 0 && (
        <View style={styles.plantsSection}>
          <Text style={styles.sectionLabel}>KANDIDAT TANAMAN</Text>
          {rec.plants.map((plant, i) => (
            <View key={i} style={styles.plantItem}>
              <View style={styles.plantNameRow}>
                <View style={[styles.plantDot, { backgroundColor: rec.accentColor }]} />
                <Text style={styles.plantName}>{plant.name}</Text>
              </View>
              <Text style={styles.plantDetail}>{plant.detail}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tips */}
      {rec.tips.length > 0 && (
        <View style={styles.tipsSection}>
          <Text style={styles.sectionLabel}>TIPS PERAWATAN</Text>
          {rec.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipNumber}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* AI Option Button */}
      {!loadingAI ? (
        <TouchableOpacity style={styles.aiButton} onPress={fetchAI} activeOpacity={0.8}>
          <Text style={styles.aiButtonText}>
            {aiRec ? 'Perbarui Analisis AI' : 'Dapatkan Insight Lanjutan (Gemini)'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.aiLoading}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.aiLoadingText}>AI sedang menganalisis...</Text>
        </View>
      )}

      {/* ML Model Status */}
      {!aiRec && (
        <View style={styles.mlStatus}>
          <Text style={styles.mlStatusText}>
            {mlLoading
              ? 'Memuat model ML...'
              : `✓ Model ML siap (skor lingkungan: ${mlPrediction?.environmentScore || 0}%)`}
          </Text>
        </View>
      )}
    </View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    padding: 32,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 4,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 6,
    bottom: 0,
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 16,
    paddingLeft: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    flex: 1,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: COLORS.surfaceElevated,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Inter-Medium',
    paddingLeft: 4,
  },
  plantsSection: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.borderLight,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
    marginBottom: 20,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  plantItem: {
    marginBottom: 16,
    backgroundColor: COLORS.surfaceElevated,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  plantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  plantDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: COLORS.primary,
  },
  plantName: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontFamily: 'Outfit-Bold',
  },
  plantDetail: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 20,
    lineHeight: 20,
  },
  tipsSection: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.borderLight,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  tipNumber: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    width: 28,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    lineHeight: 22,
    flex: 1,
  },
  aiButton: {
    marginTop: 28,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  aiButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
  aiLoading: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  aiLoadingText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: 'Inter-Bold',
  },
  mlStatus: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  mlStatusText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

export default RecommendationCard;
