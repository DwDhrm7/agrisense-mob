# Prompt Pembuatan Laporan Aplikasi AgriSense Mobile untuk Claude

Halo Claude, tolong buatkan saya sebuah laporan pengembangan sistem/aplikasi berdasarkan struktur dan poin-poin spesifik di bawah ini. Laporan ini membahas aplikasi "AgriSense Mobile", sebuah aplikasi React Native untuk monitoring pertanian pintar (Smart Agriculture) berbasis IoT (MQTT) dan Machine Learning.

Gunakan bahasa Indonesia yang formal, akademis, dan rapi sesuai standar laporan teknis/tugas akhir. Jangan gunakan gaya bahasa percakapan.

Berikut adalah kerangka dan detail fakta implementasi yang harus kamu tuliskan:

## 4.1 Analisis Kebutuhan Sistem

Jelaskan analisis kebutuhan berdasarkan pembagian berikut:
- **Kebutuhan Pengguna**: Pengguna membutuhkan aplikasi mobile yang dapat memantau kondisi lingkungan pertanian (rumah kaca/hidroponik) secara *real-time* dan memberikan rekomendasi tanaman yang cocok.
- **Kebutuhan Fungsional**:
  - Sistem dapat menampilkan halaman login.
  - Sistem dapat menampilkan dashboard monitoring lingkungan.
  - Sistem dapat menampilkan data sensor secara langsung (Suhu Udara, Kelembapan Udara, EC, TDS, Suhu Air).
  - Sistem dapat menerima data secara *real-time* melalui protokol MQTT.
  - Sistem dapat menampilkan hasil analisis atau rekomendasi tanaman pintar menggunakan komponen Machine Learning lokal.
  - Sistem dapat memvisualisasikan status koneksi MQTT (Menghubungkan, Terhubung, Terputus).
- **Kebutuhan Non-Fungsional**: Antarmuka pengguna (UI) harus responsif, modern, dan mudah dipahami. Sistem harus dapat merespons perubahan data sensor dengan cepat.
- **Batasan Sistem Lokal**: Saat ini pengujian aplikasi masih dilakukan di lingkungan emulator (local testing), koneksi MQTT menggunakan WebSockets, dan model Machine Learning berjalan secara lokal di perangkat (*on-device inference*).

## 4.2 Perancangan Arsitektur Sistem

Jabarkan perancangan arsitektur sistem dengan wajib menyertakan deskripsi alur atau diagram alur tekstual berikut:
`Sensor / Perangkat IoT (seperti NodeMCU/Raspberry Pi) → MQTT Broker → Aplikasi Mobile React Native (AgriSense Mobile) → Dashboard / Komponen Rekomendasi ML`

Tambahkan penjelasan opsional:
Jika Node-RED digunakan, posisinya berada di tengah untuk keperluan *debugging* dan simulasi pengiriman data:
`Sensor/Raspberry Pi → MQTT Broker → Node-RED (untuk simulasi/debugging) → Aplikasi React Native`

## 4.3 Implementasi Aplikasi Mobile Agrisense

Jelaskan secara naratif hasil implementasi antarmuka aplikasi. Deskripsikan bahwa aplikasi ini dikembangkan menggunakan React Native dengan beberapa komponen utama:
- **Halaman Login**: Layar otentikasi awal sebelum masuk ke sistem utama.
- **Dashboard Utama**: Menampilkan ringkasan status alat dan kondisi saat ini.
- **Kartu Data Lingkungan (Monitoring Sensor)**: Komponen UI visual yang menampilkan parameter seperti Suhu (18-35°C), Kelembapan (40-90%), EC (200-2500 µS/cm), TDS (100-1500 ppm), dan Suhu Air. Terdapat pewarnaan khusus berdasarkan indikator aman atau peringatan.
- **Status Koneksi**: Menampilkan indikator apakah aplikasi sedang terhubung dengan broker MQTT atau terputus.
- **Komponen Rekomendasi (RecommendationCard)**: Menampilkan tanaman yang paling direkomendasikan berdasarkan input sensor menggunakan analisis *Machine Learning*.

*(Beri keterangan (seolah-olah) bahwa bagian ini merujuk pada screenshot implementasi).*

## 4.4 Integrasi Data Sensor Berbasis MQTT

Tuliskan detail teknis integrasi MQTT di aplikasi:
- **Protokol & Library**: Menggunakan protokol MQTT via WebSockets (Library `paho-mqtt` versi JavaScript).
- **Topic MQTT**: Aplikasi melakukan *subscribe* ke dua topik utama, yaitu `sensor/xy_md02` (untuk suhu dan kelembapan) dan `sensor/bsk_ec100` (untuk EC, TDS, dan suhu air).
- **Contoh Payload JSON**:
  - Topik xy_md02: `{"suhu": 25.5, "kelembapan": 70}`
  - Topik bsk_ec100: `{"ec": 1200, "tds": 600, "suhuAir": 22.5}`
- **Interval Pengiriman**: Data diterima secara asinkron setiap kali broker mempublikasikan data (biasanya berinterval beberapa detik dari perangkat *hardware*).
- **Mekanisme Subscribe**: Aplikasi menggunakan metode *hook* (`useMqttMonitorHook`) untuk mengelola status koneksi, melakukan *reconnect* otomatis jika terputus, dan memparsing JSON secara otomatis. Data yang berhasil diekstrak kemudian memperbarui *state* komponen UI di Dashboard secara *real-time*.

## 4.5 Integrasi Machine Learning (Tahap Awal)

**PENTING**: Gunakan judul **"Integrasi Awal Komponen Machine Learning"** atau **"Perancangan Integrasi Machine Learning"**. Jangan menyebutkan akurasi atau mengklaim model sudah 100% diuji di lapangan.

Isi dengan fakta implementasi berikut:
- **Model yang digunakan**: Model *Deep Neural Network* (DNN / Multi-Layer Perceptron) berbasis TensorFlow/Keras yang kemudian diekspor menjadi **TensorFlow.js GraphModel** (`agrisense_model.json`). Model dijalankan secara *offline* di perangkat seluler pengguna (*on-device inference*).
- **Input**: Model menerima 5 parameter normalisasi dari sensor (Suhu, Kelembapan, EC, TDS, dan Suhu Air).
- **Output**: Klasifikasi *multi-class* yang menghasilkan nilai probabilitas (tingkat kecocokan) untuk 13 jenis komoditas tanaman (misal: Selada, Bayam, Kangkung, Pakcoy, Tomat, dll).
- **Mekanisme Prediksi & Fallback**: Aplikasi mengambil data sensor dari MQTT, memasukkannya ke dalam tensor TensorFlow.js, dan menghasilkan prediksi. Jika model ML gagal dimuat atau belum siap, sistem dilengkapi dengan *Fallback Rule-Based* (logika kondisional tradisional IF-ELSE) untuk memastikan rekomendasi tetap dapat ditampilkan berdasarkan rentang ideal parameter.

## 4.6 Pengujian Sistem

Buatlah **Tabel Pengujian Black-Box** untuk fungsionalitas utama aplikasi. Buat dalam format Markdown tabel yang rapi. 

Gunakan format tabel berikut:
| No | Fitur | Skenario Uji | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|
| 1 | Login | Pengguna memasukkan data login | Sistem masuk ke dashboard | Sesuai | Berhasil |
| 2 | Dashboard | Aplikasi menerima data sensor | Data tampil pada kartu monitoring visual | Sesuai | Berhasil |
| 3 | MQTT Integration | Aplikasi melakukan subscribe topik | Data diterima dan diparsing real-time | Sesuai | Berhasil |
| 4 | Fitur Rekomendasi | Sensor memberikan nilai spesifik (misal EC tinggi) | Komponen Rekomendasi ML menampilkan tanaman yang sesuai (misal Tomat) | Sesuai | Berhasil |
| 5 | Fallback ML | Model ML dinonaktifkan / tidak ditemukan | Sistem menggunakan rule-based untuk menampilkan rekomendasi | Sesuai | Berhasil |

## 4.7 Pembahasan

Buat paragraf pembahasan komprehensif yang merangkum keseluruhan implementasi, menghubungkannya dengan referensi konsep dasar:
- Peran IoT yang memungkinkan digitalisasi dan monitoring lapangan secara jarak jauh.
- Keunggulan MQTT yang sangat ringan untuk pertukaran data telemetri.
- Pendekatan aplikasi *mobile* menggunakan React Native mempermudah petani untuk memantau kapan saja dan di mana saja.
- Potensi integrasi awal *Machine Learning* yang dijalankan *on-device* (*edge AI*) memungkinkan analitik prediktif berjalan tanpa memerlukan koneksi internet server yang cepat. 
- Berikan catatan evaluasi bahwa sistem masih berjalan dalam tahap *local testing* (emulator Android) sehingga evaluasi lebih difokuskan pada pemenuhan syarat fungsionalitas UI dan alur komunikasi.

## 4.8 Kendala dan Solusi

Jelaskan kendala yang dialami selama pengembangan dan solusinya:
- **Kendala**: Sistem pengujian masih bergantung pada lingkungan lokal (Emulator).
  **Solusi**: Pengujian difokuskan menggunakan simulator Android Studio dengan *port forwarding* ke *broker* MQTT lokal.
- **Kendala**: Data sensor fisik dari perangkat keras sesungguhnya belum tersedia secara kontinyu atau sering terputus.
  **Solusi**: Menggunakan *tools* pihak ketiga seperti Node-RED atau script simulasi untuk menembak (*publish*) payload data *dummy* JSON ke *broker* guna memvalidasi fungsionalitas UI.
- **Kendala**: Integrasi MQTT via WebSocket terkadang gagal karena konfigurasi jaringan keamanan (SSL/Port).
  **Solusi**: Mengimplementasikan logika *fallback connection* secara bertingkat di *service* MQTT (mencoba beberapa varian *port* seperti 8884, 443, dan path `/mqtt`, `/ws`).
- **Kendala**: Komponen Machine Learning belum memiliki *dataset* nyata yang masif dari kebun hidroponik.
  **Solusi**: Integrasi ditujukan sebagai "Tahap Awal" (*proof of concept*) menggunakan *dataset* simulasi dan dilengkapi dengan algoritma cadangan *rule-based* untuk keandalan produksi.

---

*Tolong hasilkan laporan utuhnya mulai dari sub-bab 4.1 hingga 4.8 sesuai instruksi di atas.*
