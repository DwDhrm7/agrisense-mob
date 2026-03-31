import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../utils/theme';
import type { SensorData } from '../services/MqttService';
import { getGeminiRecommendation, type AIRecommendation } from '../services/GeminiService';

interface Recommendation {
  title: string;
  text: string;
  plants: Array<{ name: string; detail: string }>;
  tips: string[];
  confidence: string;
  accentColor: string;
}

interface RecommendationCardProps {
  sensors: SensorData;
}

function getRecommendation(sensors: SensorData, COLORS: any): Recommendation {
  const s = parseFloat(sensors.suhu);
  const h = parseFloat(sensors.kelembapan);
  const ec = parseFloat(sensors.ec);

  if (isNaN(s) || sensors.suhu === '–') {
    return {
      title: 'Menunggu Data Sensor',
      text: 'Sistem sedang mengumpulkan pembacaan lingkungan untuk memberikan rekomendasi yang akurat.',
      plants: [],
      tips: [],
      confidence: '–',
      accentColor: COLORS.textLight,
    };
  }

  if (s >= 20 && s <= 30 && h >= 60 && h <= 80 && !isNaN(ec) && ec > 800) {
    return {
      title: 'Sangat Direkomendasikan: Sayuran Daun',
      text: `Stabilitas suhu di ${s}°C dengan kelembapan ${h}% dan EC ${ec} µS/cm. Iklim mendukung pertumbuhan sayuran daun secara optimal.`,
      plants: [
        { name: 'Selada (Lettuce)', detail: 'Suhu ideal 15–25°C · panen 30–45 hari' },
        { name: 'Bayam (Spinach)', detail: 'Tumbuh cepat · panen 25–30 hari' },
        { name: 'Kangkung', detail: 'Cocok hidroponik · panen 21–30 hari' },
        { name: 'Sawi (Mustard Greens)', detail: 'Tahan panas ringan · 30–35 hari' },
        { name: 'Pakcoy', detail: 'EC ideal 1000–1500 µS/cm · 25–30 hari' },
      ],
      tips: [
        'Jaga EC antara 800–1500 µS/cm untuk pertumbuhan optimal.',
        'Pastikan sirkulasi udara baik untuk mencegah jamur.',
        'Lakukan pengecekan pH air secara berkala (pH 5.5–6.5).',
      ],
      confidence: 'Tinggi',
      accentColor: COLORS.primary,
    };
  }

  if (s > 30) {
    return {
      title: 'Direkomendasikan: Tanaman Tahan Panas',
      text: `Suhu ${s}°C tergolong tinggi. Tanaman tropis dan varietas tahan panas akan tumbuh lebih baik di kondisi ini.`,
      plants: [
        { name: 'Cabai Rawit', detail: 'Optimal 25–35°C · tahan panas tinggi' },
        { name: 'Tomat Cherry', detail: 'Produktivitas tinggi pada suhu hangat' },
        { name: 'Terong', detail: 'Menyukai 25–35°C · butuh cahaya penuh' },
        { name: 'Kemangi', detail: 'Aroma terbaik pada suhu hangat · panen cepat' },
        { name: 'Mentimun', detail: 'Tumbuh cepat · butuh air cukup' },
      ],
      tips: [
        'Tingkatkan frekuensi irigasi untuk kompensasi penguapan.',
        'Gunakan paranet 50% jika suhu melebihi 38°C.',
        'Monitor kelembapan — suhu tinggi percepat dehidrasi.',
      ],
      confidence: 'Sedang',
      accentColor: COLORS.warning,
    };
  }

  if (s < 20) {
    return {
      title: 'Direkomendasikan: Sayuran Iklim Sejuk',
      text: `Suhu ${s}°C termasuk sejuk. Sayuran iklim sedang dan subtropis akan berproduksi optimal.`,
      plants: [
        { name: 'Brokoli', detail: 'Optimal 15–20°C · butuh nutrisi tinggi' },
        { name: 'Stroberi', detail: 'Suhu ideal 15–25°C · perlu perhatian ekstra' },
        { name: 'Kubis', detail: 'Tahan dingin · panen 60–80 hari' },
        { name: 'Wortel', detail: 'Akar tumbuh baik di suhu sejuk' },
        { name: 'Seledri', detail: 'Optimal 15–21°C · butuh kelembapan tinggi' },
      ],
      tips: [
        'Gunakan mulsa untuk menjaga suhu tanah tetap stabil.',
        'Pastikan drainase baik — suhu rendah memperlambat penguapan.',
        'Kurangi pemberian nutrisi karena metabolisme melambat.',
      ],
      confidence: 'Sedang',
      accentColor: COLORS.kelembapan,
    };
  }

  return {
    title: 'Peringatan: Kondisi Adaptif',
    text: `Suhu ${s}°C dengan kelembapan ${h}%. Perlu pengawasan lebih ketat terhadap asupan nutrisi dan pengendalian iklim mikro.`,
    plants: [
      { name: 'Pakcoy', detail: 'Adaptif pada berbagai kondisi · panen cepat' },
      { name: 'Kailan', detail: 'Toleran terhadap variasi suhu' },
      { name: 'Selada Romaine', detail: 'Lebih tahan panas dari selada biasa' },
      { name: 'Bayam Merah', detail: 'Antioksidan tinggi · adaptif' },
    ],
    tips: [
      'Pantau fluktuasi suhu harian untuk identifikasi tren.',
      'Sesuaikan EC berdasarkan fase pertumbuhan tanaman.',
      'Pertimbangkan penggunaan controller suhu otomatis.',
    ],
    confidence: 'Rendah',
    accentColor: COLORS.warning,
  };
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ sensors }) => {
  const COLORS = useTheme();
  const styles = getStyles(COLORS);

  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRec, setAiRec] = useState<AIRecommendation | null>(null);

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

  const rec = aiRec
    ? { ...aiRec, confidence: '✨ AI Generated', accentColor: COLORS.primary }
    : getRecommendation(sensors, COLORS);

  return (
    <View style={styles.container}>
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: rec.accentColor }]} />

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{rec.title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
            {aiRec ? '🔄 Perbarui Analisis AI' : '✨ Dapatkan Insight AI (Gemini)'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.aiLoading}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.aiLoadingText}>AI sedang menganalisis...</Text>
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
});

export default RecommendationCard;
