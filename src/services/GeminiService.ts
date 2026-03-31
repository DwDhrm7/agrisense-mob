import { GEMINI_CONFIG } from '../utils/config';
import type { SensorData } from './MqttService';

export interface AIRecommendation {
  title: string;
  text: string;
  plants: Array<{ name: string; detail: string }>;
  tips: string[];
}

export async function getGeminiRecommendation(sensors: SensorData): Promise<AIRecommendation | null> {
  if (!GEMINI_CONFIG.enabled || !GEMINI_CONFIG.apiKey || GEMINI_CONFIG.apiKey === 'YOUR_GEMINI_API_KEY') {
    throw new Error('API Key Gemini belum dikonfigurasi. Silakan update di src/utils/config.ts');
  }

  const prompt = `Saya memiliki data sensor pertanian/greenhouse sebagai berikut:
Suhu Udara: ${sensors.suhu} °C
Kelembapan: ${sensors.kelembapan} %
EC: ${sensors.ec} µS/cm
TDS: ${sensors.tds} ppm
Suhu Air: ${sensors.suhuAir} °C

Tolong berikan analisis teknis singkat dan rekomendasi tanaman apa saja yang paling optimal ditanam pada kondisi spesifik tersebut, serta berikan tips perawatannya.
Penting: Berikan balasan STRICTLY dalam format JSON menggunakan struktur di bawah ini tanpa markdown code blocks tambahan:
{
  "title": "Judul Kesimpulan Singkat (contoh: Optimal untuk Sayuran Daun)",
  "text": "Analisis kondisi lingkungan secara singkat (maksimal 2-3 kalimat)",
  "plants": [
    { "name": "Nama Tanaman", "detail": "Alasan singkat mengapa cocok" }
  ],
  "tips": [
    "Tip perawatan spesifik berdasarkan data di atas",
    "Tip perawatan lainnya"
  ]
}`;

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_CONFIG.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errData = await response.text();
    console.error('Gemini API Error:', errData);
    throw new Error(`Gemini Error: ${errData.substring(0, 250)}`);
  }

  const data = await response.json();
  let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (resultText) {
    try {
      // Clean up markdown blocks if the model includes them
      const jsonStr = resultText.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr) as AIRecommendation;
    } catch (e) {
      console.error('Gagal parsing JSON dari Gemini:', resultText);
      throw new Error('Format balasan Gemini tidak valid JSON.');
    }
  }

  return null;
}
