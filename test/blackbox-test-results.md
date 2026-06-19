# Hasil Pengujian Black-Box (AgriSense Mobile)

Pengujian ini dilakukan menggunakan metode Black-Box dengan fokus pada pemenuhan fungsionalitas sistem berdasarkan interaksi antarmuka pengguna (UI) dan alur kerja aplikasi (bukan pengujian struktur kode internal).

| No | Fitur / Modul | Skenario Uji | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|--------------|--------------|-----------------------|--------------|--------|
| **1** | **Otentikasi (Login)** | Pengguna memasukkan username & password yang benar, lalu menekan tombol Login | Sistem memvalidasi kredensial dan mengarahkan pengguna masuk ke halaman Dashboard Utama | Pengguna berhasil masuk dan melihat antarmuka Dashboard | ✅ Berhasil |
| **2** | **Otentikasi (Login)** | Pengguna memasukkan kredensial yang salah / kosong | Sistem menampilkan pesan error/peringatan bahwa kredensial tidak valid | Muncul pesan peringatan dan pengguna tetap di halaman Login | ✅ Berhasil |
| **3** | **Dashboard (UI)** | Aplikasi memuat halaman utama setelah login | Sistem menampilkan ringkasan cuaca, indikator sensor (Suhu, Kelembapan, EC, TDS, Suhu Air), dan grafik histori data | Seluruh kartu komponen antarmuka termuat dengan baik | ✅ Berhasil |
| **4** | **MQTT Integration** | Sistem membuka koneksi ke MQTT broker pada saat aplikasi berada di Dashboard | Indikator status koneksi berubah dari "Menghubungkan..." menjadi "Terhubung" | Status di aplikasi menampilkan tulisan "Terhubung" berwarna hijau | ✅ Berhasil |
| **5** | **MQTT Integration** | Broker mengirimkan data sensor (payload JSON) ke topik yang telah di-*subscribe* | Data sensor pada Dashboard otomatis diperbarui secara *real-time* tanpa *refresh* manual | Angka sensor pada kartu antarmuka berubah menyesuaikan payload yang dikirim | ✅ Berhasil |
| **6** | **MQTT Fallback** | Broker tiba-tiba terputus atau *port* ditutup | Aplikasi mendeteksi putusnya koneksi, status berubah menjadi "Terputus", dan mencoba menyambung ulang (*reconnect*) secara otomatis | Tampil status "Terputus" dan *retry* berjalan di latar belakang | ✅ Berhasil |
| **7** | **Fitur Rekomendasi (ML)** | Terdapat data sensor *real-time* yang valid (Suhu, Kelembapan, EC) di Dashboard | Sistem memasukkan data tersebut ke model TensorFlow.js dan memunculkan rekomendasi tanaman (misal: "Selada") lengkap dengan probabilitas kecocokan | Komponen `RecommendationCard` menampilkan nama tanaman dan skor *confidence* | ✅ Berhasil |
| **8** | **Fitur Rekomendasi (Fallback)** | Model ML gagal dimuat atau belum diinisialisasi sepenuhnya | Sistem beralih menggunakan logika kondisi *rule-based* untuk tetap menampilkan rekomendasi berdasarkan rentang parameter sensor | Rekomendasi tanaman tetap muncul dengan penanda sumber *fallback* | ✅ Berhasil |
| **9** | **Log Aktivitas** | Pengguna menavigasi ke *tab* Log Aktivitas | Menampilkan daftar *history* riwayat log aktivitas yang terjadi di sistem (koneksi, error, data sensor) | Log historis tampil berurutan berdasarkan waktu terbaru | ✅ Berhasil |
| **10** | **Settings & Threshold** | Pengguna Admin mengubah batas parameter (Threshold) melalui layar Pengaturan | Aplikasi menyimpan pengaturan baru secara lokal | Pengaturan tersimpan dan indikator peringatan sensor merespons *threshold* baru | ✅ Berhasil |
| **11** | **Theme Switcher** | Pengguna menekan *toggle* ikon tema pada pojok kanan atas Dashboard | Tampilan aplikasi langsung merubah skema warna (dari Mode Terang ke Gelap, atau sebaliknya) secara reaktif | Aplikasi berhasil berpindah mode visual dengan transisi yang tepat | ✅ Berhasil |

---
**Catatan Evaluasi:**
- Seluruh fungsionalitas utama (*happy path*) beroperasi sesuai dengan ekspektasi.
- Komponen komunikasi jaringan (MQTT) berfungsi asinkron dengan baik pada skenario pengujian lokal via *port-forwarding* emulator.
- Fallback UI (*handling state* error dan *loading*) berhasil mencegah aplikasi mengalami *crash* saat data *broker* terlambat datang.
