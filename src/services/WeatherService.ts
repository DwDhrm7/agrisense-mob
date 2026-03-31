
import { OPENMETEO_CONFIG } from '../utils/config';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  icon: string;
  feelsLike: number;
  uvIndex: number;
  precipitation: number;
}

const WMO_DESCRIPTIONS: Record<number, { desc: string; icon: string }> = {
  0: { desc: 'Cerah', icon: '☀️' },
  1: { desc: 'Sebagian Cerah', icon: '🌤️' },
  2: { desc: 'Berawan Sebagian', icon: '⛅' },
  3: { desc: 'Mendung', icon: '☁️' },
  45: { desc: 'Berkabut', icon: '🌫️' },
  48: { desc: 'Kabut Beku', icon: '🌫️' },
  51: { desc: 'Gerimis Ringan', icon: '🌦️' },
  53: { desc: 'Gerimis', icon: '🌦️' },
  55: { desc: 'Gerimis Lebat', icon: '🌧️' },
  61: { desc: 'Hujan Ringan', icon: '🌧️' },
  63: { desc: 'Hujan Sedang', icon: '🌧️' },
  65: { desc: 'Hujan Lebat', icon: '⛈️' },
  80: { desc: 'Hujan Lokal', icon: '🌦️' },
  81: { desc: 'Hujan Sedang Lokal', icon: '🌧️' },
  82: { desc: 'Hujan Deras Lokal', icon: '⛈️' },
  95: { desc: 'Badai Petir', icon: '⛈️' },
  96: { desc: 'Badai Petir + Hujan Es', icon: '🌩️' },
  99: { desc: 'Badai Petir Berat', icon: '🌩️' },
};

function getWMOInfo(code: number) {
  return WMO_DESCRIPTIONS[code] || { desc: 'Tidak Diketahui', icon: '🌡️' };
}

export async function fetchWeather(): Promise<WeatherData | null> {
  if (!OPENMETEO_CONFIG.enabled) return null;

  try {
    const { latitude, longitude, timezone } = OPENMETEO_CONFIG;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index,precipitation` +
      `&timezone=${encodeURIComponent(timezone)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API error');

    const json = await response.json();
    const c = json.current;
    const wmo = getWMOInfo(c.weather_code);

    return {
      temperature: Math.round(c.temperature_2m * 10) / 10,
      humidity: Math.round(c.relative_humidity_2m),
      windSpeed: Math.round(c.wind_speed_10m * 10) / 10,
      weatherCode: c.weather_code,
      description: wmo.desc,
      icon: wmo.icon,
      feelsLike: Math.round(c.apparent_temperature * 10) / 10,
      uvIndex: Math.round(c.uv_index * 10) / 10,
      precipitation: Math.round(c.precipitation * 10) / 10,
    };
  } catch (err) {
    console.warn('[WeatherService] Gagal mengambil data cuaca:', err);
    return null;
  }
}
