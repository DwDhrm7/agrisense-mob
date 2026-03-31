// ──────────────────────────────────────────────
// AgriSense · Settings Screen
// ──────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Share, Switch,
} from 'react-native';
import { MQTT_CONFIG, SENSOR_THRESHOLDS, OPENMETEO_CONFIG, INFLUX_CONFIG, TELEGRAM_CONFIG } from '../utils/config';
import { useTheme } from '../utils/theme';
import DataStore from '../services/DataStore';
import MqttService from '../services/MqttService';
import type { ConnectionStatus } from '../services/MqttService';

interface SettingsScreenProps {
  user: any;
  connectionStatus: ConnectionStatus;
  onLogout: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, connectionStatus, onLogout }) => {
  const COLORS = useTheme();
  const styles = typeof getStyles !== "undefined" ? getStyles(COLORS) : {} as any;

  const [thresholds, setThresholds] = useState({ ...SENSOR_THRESHOLDS });
  const [telegramConf, setTelegramConf] = useState({ ...TELEGRAM_CONFIG });
  const [editing, setEditing] = useState(false);
  const [editingTg, setEditingTg] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handleExportCSV = async () => {
    const data = DataStore.getHistory();
    if (data.length === 0) {
      Alert.alert('Kosong', 'Tidak ada riwayat sensor yang tersedia untuk diekspor.');
      return;
    }
    const header = 'Waktu,Suhu (C),Kelembapan (%),EC (uS/cm),TDS (ppm),Suhu Air (C)\n';
    const rows = data.map(d => `${d.time},${d.suhu ?? ''},${d.kelembapan ?? ''},${d.ec ?? ''},${d.tds ?? ''},${d.suhuAir ?? ''}`).join('\n');
    const csvStr = header + rows;
    
    try {
      await Share.share({
        message: csvStr,
        title: 'Export Riwayat Sensor AgriSense',
      });
      DataStore.addLog('success', 'Data diekspor ke format teks (CSV)', 'system');
    } catch (e: any) {
      Alert.alert('Gagal Ekspor', e.message);
    }
  };

  const handleSave = () => {
    // In production, persist to AsyncStorage or backend
    Object.assign(SENSOR_THRESHOLDS, thresholds);
    setEditing(false);
    Alert.alert('Berhasil', 'Konfigurasi ambang batas telah disimpan.');
  };

  const handleCancel = () => {
    setThresholds({ ...SENSOR_THRESHOLDS });
    setEditing(false);
  };

  const updateThreshold = (key: string, field: 'min' | 'max', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setThresholds(prev => ({
      ...prev,
      [key]: { ...prev[key as keyof typeof prev], [field]: num },
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengaturan</Text>
        <Text style={styles.headerSub}>Konfigurasi & Informasi Sistem</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profil ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROFIL</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarLetter}>{(user?.name || 'U')[0]}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                <Text style={styles.profileRole}>
                  {isAdmin ? 'Administrator' : 'Pengguna'} · @{user?.username}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutRow} onPress={onLogout} activeOpacity={0.6}>
              <Text style={styles.logoutText}>Keluar dari akun</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Koneksi ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>KONEKSI</Text>
          <View style={styles.card}>
            <InfoRow label="Status" value={connectionStatus} valueColor={connectionStatus === 'Terhubung' ? COLORS.primary : COLORS.error} />
            <InfoRow label="Broker" value={MQTT_CONFIG.host.split('.')[0] + '...'} />
            <InfoRow label="Port" value={`${MQTT_CONFIG.port} (WSS)`} />
            <InfoRow label="Topic XY" value={MQTT_CONFIG.topicXY} />
            <InfoRow label="Topic BSK" value={MQTT_CONFIG.topicBSK} />
            <View style={styles.divider} />
            <InfoRow label="InfluxDB" value={INFLUX_CONFIG.host} />
            <InfoRow label="Database" value={INFLUX_CONFIG.db} last />
          </View>
        </View>

        {/* ── Lokasi & Cuaca ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOKASI</Text>
          <View style={styles.card}>
            <InfoRow label="Kota" value={OPENMETEO_CONFIG.city} />
            <InfoRow label="Koordinat" value={`${OPENMETEO_CONFIG.latitude}, ${OPENMETEO_CONFIG.longitude}`} />
            <InfoRow label="Timezone" value={OPENMETEO_CONFIG.timezone} />
            <InfoRow label="Cuaca API" value="Open-Meteo (Aktif)" valueColor={COLORS.primary} last />
          </View>
        </View>

        {/* ── Ambang Batas ── */}
        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>AMBANG BATAS SENSOR</Text>
              {!editing ? (
                <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.6}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={handleCancel} activeOpacity={0.6}>
                    <Text style={styles.cancelLink}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} activeOpacity={0.6}>
                    <Text style={styles.saveLink}>Simpan</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.card}>
              {Object.entries(thresholds).map(([key, val], i, arr) => (
                <ThresholdRow
                  key={key}
                  label={val.label}
                  unit={val.unit}
                  min={val.min}
                  max={val.max}
                  editing={editing}
                  onMinChange={(v) => updateThreshold(key, 'min', v)}
                  onMaxChange={(v) => updateThreshold(key, 'max', v)}
                  last={i === arr.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Tentang ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TENTANG</Text>
          <View style={styles.card}>
            <InfoRow label="Aplikasi" value="AgriSense Mobile" />
            <InfoRow label="Versi" value="Prototype" />
            <InfoRow label="Framework" value="React Native 0.84" />
            <InfoRow label="Protokol" value="MQTT over WSS" />
            <InfoRow label="Pengembang" value="Bima Sakti Sanjaya" last />
          </View>
        </View>

        {/* ── Ekspor Data ── */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EKSPOR DATA</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.actionRow} onPress={handleExportCSV}>
                <Text style={styles.actionText}>Export Riwayat Sensor (CSV / Teks)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Notifikasi Telegram ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>NOTIFIKASI TELEGRAM</Text>
            {isAdmin && (!editingTg ? (
              <TouchableOpacity onPress={() => setEditingTg(true)} activeOpacity={0.6}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => { setTelegramConf({...TELEGRAM_CONFIG}); setEditingTg(false); }} activeOpacity={0.6}>
                  <Text style={styles.cancelLink}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { Object.assign(TELEGRAM_CONFIG, telegramConf); setEditingTg(false); Alert.alert('Tersimpan', 'Konfigurasi Telegram diperbarui.'); }} activeOpacity={0.6}>
                  <Text style={styles.saveLink}>Simpan</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.card}>
            <View style={[getInfoStyles(COLORS).row, isAdmin && getInfoStyles(COLORS).rowBorder]}>
              <Text style={getInfoStyles(COLORS).label}>Status Notifikasi</Text>
              {isAdmin && editingTg ? (
                <Switch
                  value={telegramConf.enabled}
                  onValueChange={(val) => setTelegramConf(p => ({ ...p, enabled: val }))}
                  trackColor={{ false: COLORS.borderLight, true: 'rgba(39, 174, 96, 0.4)' }}
                  thumbColor={telegramConf.enabled ? COLORS.success : COLORS.textMuted}
                  ios_backgroundColor={COLORS.borderLight}
                  style={{ transform: [{ scale: 0.8 }] }}
                />
              ) : (
                <View style={{
                  backgroundColor: telegramConf.enabled ? COLORS.primarySoft : COLORS.errorSoft,
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6
                }}>
                  <Text style={{
                    fontSize: 10, fontFamily: 'Inter-SemiBold', 
                    color: telegramConf.enabled ? COLORS.primary : COLORS.error,
                    letterSpacing: 0.5, textTransform: 'uppercase'
                  }}>
                    {telegramConf.enabled ? 'AKTIF' : 'NONAKTIF'}
                  </Text>
                </View>
              )}
            </View>
            {isAdmin && (
              <View style={getThrStyles(COLORS).row}>
                <Text style={getThrStyles(COLORS).label}>Bot Token</Text>
                <TextInput
                  style={[getThrStyles(COLORS).input, { marginTop: 8 }, !editingTg && getThrStyles(COLORS).inputDisabled]}
                  value={telegramConf.botToken}
                  onChangeText={(val) => setTelegramConf(prev => ({ ...prev, botToken: val }))}
                  editable={editingTg}
                  secureTextEntry={!editingTg}
                />
                <Text style={[getThrStyles(COLORS).label, { marginTop: 12 }]}>Chat ID Target</Text>
                <TextInput
                  style={[getThrStyles(COLORS).input, { marginTop: 8 }, !editingTg && getThrStyles(COLORS).inputDisabled]}
                  value={telegramConf.chatId}
                  onChangeText={(val) => setTelegramConf(prev => ({ ...prev, chatId: val }))}
                  editable={editingTg}
                />
              </View>
            )}
          </View>
        </View>

        {/* ── Pengembangan ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SEGERA HADIR</Text>
          <View style={styles.card}>
            <FutureRow title="Multi-Greenhouse" desc="Dukungan monitoring dan agregasi beberapa greenhouse sekaligus" last />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Sub Components ──

const InfoRow = ({ label, value, valueColor, last }: {
  label: string; value: string; valueColor?: string; last?: boolean;
}) => {
  const COLORS = useTheme();
  const infoStyles = getInfoStyles(COLORS);
  return (
  <View style={[infoStyles.row, !last && infoStyles.rowBorder]}>
    <Text style={infoStyles.label}>{label}</Text>
    <Text style={[infoStyles.value, valueColor ? { color: valueColor } : {}]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);
};

const ThresholdRow = ({ label, unit, min, max, editing, onMinChange, onMaxChange, last }: {
  label: string; unit: string; min: number; max: number;
  editing: boolean; onMinChange: (v: string) => void; onMaxChange: (v: string) => void; last?: boolean;
}) => {
  const COLORS = useTheme();
  const thrStyles = getThrStyles(COLORS);
  return (
  <View style={[thrStyles.row, !last && thrStyles.rowBorder]}>
    <View style={thrStyles.labelRow}>
      <Text style={thrStyles.label}>{label}</Text>
      <Text style={thrStyles.unit}>{unit}</Text>
    </View>
    <View style={thrStyles.inputRow}>
      <View style={thrStyles.inputGroup}>
        <Text style={thrStyles.inputLabel}>Min</Text>
        <TextInput
          style={[thrStyles.input, !editing && thrStyles.inputDisabled]}
          value={String(min)}
          onChangeText={onMinChange}
          editable={editing}
          keyboardType="numeric"
        />
      </View>
      <View style={thrStyles.inputGroup}>
        <Text style={thrStyles.inputLabel}>Max</Text>
        <TextInput
          style={[thrStyles.input, !editing && thrStyles.inputDisabled]}
          value={String(max)}
          onChangeText={onMaxChange}
          editable={editing}
          keyboardType="numeric"
        />
      </View>
    </View>
  </View>
);
};

const FutureRow = ({ title, desc, last }: { title: string; desc: string; last?: boolean }) => {
  const COLORS = useTheme();
  const futStyles = getFutStyles(COLORS);
  return (
  <View style={[futStyles.row, !last && futStyles.rowBorder]}>
    <View style={futStyles.dot} />
    <View style={futStyles.content}>
      <Text style={futStyles.title}>{title}</Text>
      <Text style={futStyles.desc}>{desc}</Text>
    </View>
    <Text style={futStyles.tag}>SOON</Text>
  </View>
);
};

// ── Styles ──

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  headerTitle: { fontSize: 32, fontFamily: 'Outfit-Bold', color: COLORS.textPrimary, letterSpacing: -1 },
  headerSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, fontFamily: 'Inter-Medium' },

  scroll: { padding: 20 },
  section: { marginBottom: 36 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter-Bold', color: COLORS.textMuted,
    letterSpacing: 2, marginBottom: 18, textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18,
  },
  editLink: { fontSize: 13, fontFamily: 'Inter-Bold', color: COLORS.textPrimary, backgroundColor: COLORS.surfaceElevated, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder },
  cancelLink: { fontSize: 13, fontFamily: 'Inter-Bold', color: COLORS.textMuted, paddingHorizontal: 14, paddingVertical: 8 },
  saveLink: { fontSize: 13, fontFamily: 'Inter-Bold', color: COLORS.textPrimary, backgroundColor: COLORS.surfaceElevated, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.glassBorder },

  card: {
    backgroundColor: COLORS.surface, 
    borderRadius: 28,
    borderWidth: 1.5, 
    borderColor: COLORS.glassBorder, 
    overflow: 'hidden',
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  divider: { height: 1.5, backgroundColor: COLORS.borderLight, marginHorizontal: 24, opacity: 0.5 },

  profileRow: {
    flexDirection: 'row', alignItems: 'center', padding: 24, gap: 20,
  },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.surfaceElevated, borderWidth: 2, borderColor: COLORS.glassBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontSize: 28, fontFamily: 'Outfit-Bold', color: COLORS.textPrimary },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontFamily: 'Outfit-Bold', color: COLORS.textPrimary, letterSpacing: -0.5 },
  profileRole: { fontSize: 13, fontFamily: 'Inter-Medium', color: COLORS.textMuted, marginTop: 2 },
  logoutRow: {
    paddingHorizontal: 24, paddingVertical: 20,
    borderTopWidth: 1.5, borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceElevated,
  },
  logoutText: { fontSize: 15, fontFamily: 'Outfit-Bold', color: COLORS.textPrimary, textAlign: 'center', letterSpacing: 0.5 },

  actionRow: {
    paddingHorizontal: 20, paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  actionText: { fontSize: 14, fontFamily: 'Inter-Bold', color: COLORS.primary },
});

const getInfoStyles = (COLORS: any) => StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 18,
  },
  rowBorder: { borderBottomWidth: 1.5, borderBottomColor: COLORS.borderLight },
  label: { fontSize: 15, fontFamily: 'Inter-Medium', color: COLORS.textSecondary },
  value: { fontSize: 15, fontFamily: 'Outfit-Bold', color: COLORS.textPrimary, maxWidth: '55%', textAlign: 'right' },
});

const getThrStyles = (COLORS: any) => StyleSheet.create({
  row: { padding: 20 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  label: { fontSize: 15, fontFamily: 'Outfit-Bold', color: COLORS.textPrimary },
  unit: { fontSize: 12, fontFamily: 'Inter-Bold', color: COLORS.textMuted, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', gap: 16 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 10, fontFamily: 'Inter-Bold', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: COLORS.surfaceElevated, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Outfit-Bold', color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.glassBorder,
  },
  inputDisabled: { opacity: 0.6 },
});

const getFutStyles = (COLORS: any) => StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primarySoft, borderWidth: 2, borderColor: COLORS.primary },
  content: { flex: 1 },
  title: { fontSize: 15, fontFamily: 'Outfit-Bold', color: COLORS.textPrimary },
  desc: { fontSize: 13, fontFamily: 'Inter-Medium', color: COLORS.textMuted, marginTop: 4, lineHeight: 18 },
  tag: {
    fontSize: 9, fontFamily: 'Inter-Bold', color: COLORS.primary,
    letterSpacing: 1.2, backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
});

export default SettingsScreen;
