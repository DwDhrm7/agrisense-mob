import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { COLORS } from '../utils/config';
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

function getRecommendation(sensors: SensorData): Recommendation {
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
    : getRecommendation(sensors);

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

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    fontFamily: 'Inter-Regular',
  },
  plantsSection: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionLabel: {
    color: COLORS.textLight,
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  plantItem: {
    marginBottom: 12,
  },
  plantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 10,
  },
  plantName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  plantDetail: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 14,
    marginTop: 3,
    lineHeight: 17,
  },
  tipsSection: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 10,
  },
  tipNumber: {
    color: COLORS.textLight,
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    width: 20,
    letterSpacing: 0.5,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 19,
    flex: 1,
  },
  aiButton: {
    marginTop: 20,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  aiButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  aiLoading: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  aiLoadingText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
});

export default RecommendationCard;
