// ──────────────────────────────────────────────
// AgriSense · History Screen
// ──────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useTheme } from '../utils/theme';
import DataStore, { HistoryEntry } from '../services/DataStore';

const HistoryScreen: React.FC = () => {
  const COLORS = useTheme();
  const styles = getStyles(COLORS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState(DataStore.getStats());
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'stats'>('stats');

  const refresh = useCallback(() => {
    setHistory(DataStore.getHistory());
    setStats(DataStore.getStats());
  }, []);

  useEffect(() => {
    refresh();
    const unsub = DataStore.onHistoryChange(refresh);
    return unsub;
  }, [refresh]);

  const onRefresh = () => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' +
      d.getMinutes().toString().padStart(2, '0') + ':' +
      d.getSeconds().toString().padStart(2, '0');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Riwayat Data</Text>
          <Text style={styles.headerSub}>
            {stats.totalReadings} pembacaan · Uptime {stats.uptime}
          </Text>
        </View>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'stats' && styles.toggleActive]}
            onPress={() => setViewMode('stats')} activeOpacity={0.6}>
            <Text style={[styles.toggleText, viewMode === 'stats' && styles.toggleTextActive]}>Ringkasan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'table' && styles.toggleActive]}
            onPress={() => setViewMode('table')} activeOpacity={0.6}>
            <Text style={[styles.toggleText, viewMode === 'table' && styles.toggleTextActive]}>Tabel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {viewMode === 'stats' ? (
          <>
            {/* Stats Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>STATISTIK SESI</Text>
              <View style={styles.statsGrid}>
                <StatBox label="Rata-rata Suhu" value={stats.avgSuhu !== null ? `${stats.avgSuhu}°` : '–'} />
                <StatBox label="Rata-rata Kelembapan" value={stats.avgKelembapan !== null ? `${stats.avgKelembapan}%` : '–'} />
                <StatBox label="Suhu Min" value={stats.minSuhu !== null ? `${stats.minSuhu}°` : '–'} />
                <StatBox label="Suhu Max" value={stats.maxSuhu !== null ? `${stats.maxSuhu}°` : '–'} />
                <StatBox label="Kelembapan Min" value={stats.minKelembapan !== null ? `${stats.minKelembapan}%` : '–'} />
                <StatBox label="Kelembapan Max" value={stats.maxKelembapan !== null ? `${stats.maxKelembapan}%` : '–'} />
              </View>
            </View>

            {/* EC Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>NUTRISI</Text>
              <View style={styles.statsGrid}>
                <StatBox label="Rata-rata EC" value={stats.avgEc !== null ? `${stats.avgEc}` : '–'} unit="µS/cm" />
                <StatBox label="Total Pembacaan" value={`${stats.totalReadings}`} />
              </View>
            </View>

            {/* Recent 10 readings compact */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>10 PEMBACAAN TERAKHIR</Text>
              {history.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Belum ada data. Data akan muncul saat sensor mengirim pembacaan.</Text>
                </View>
              ) : (
                <View style={styles.compactList}>
                  {history.slice(-10).reverse().map((entry, i) => (
                    <View key={i} style={[styles.compactRow, i === 0 && styles.compactFirst]}>
                      <Text style={styles.compactTime}>{formatTime(entry.timestamp)}</Text>
                      <View style={styles.compactValues}>
                        {entry.suhu !== null && (
                          <Text style={[styles.compactValue, { color: COLORS.suhu }]}>{entry.suhu}°C</Text>
                        )}
                        {entry.kelembapan !== null && (
                          <Text style={[styles.compactValue, { color: COLORS.kelembapan }]}>{entry.kelembapan}%</Text>
                        )}
                        {entry.ec !== null && (
                          <Text style={[styles.compactValue, { color: COLORS.ec }]}>{entry.ec} EC</Text>
                        )}
                        {entry.tds !== null && (
                          <Text style={[styles.compactValue, { color: COLORS.tds }]}>{entry.tds} TDS</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : (
          /* Table View */
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DATA MENTAH</Text>
            {history.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Belum ada data.</Text>
              </View>
            ) : (
              <View style={styles.table}>
                {/* Table header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Waktu</Text>
                  <Text style={styles.tableHeaderCell}>Suhu</Text>
                  <Text style={styles.tableHeaderCell}>Hum</Text>
                  <Text style={styles.tableHeaderCell}>EC</Text>
                  <Text style={styles.tableHeaderCell}>TDS</Text>
                </View>
                {history.slice().reverse().map((entry, i) => (
                  <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                    <Text style={[styles.tableCell, styles.tableCellTime, { flex: 1.2 }]}>{formatTime(entry.timestamp)}</Text>
                    <Text style={styles.tableCell}>{entry.suhu ?? '–'}</Text>
                    <Text style={styles.tableCell}>{entry.kelembapan ?? '–'}</Text>
                    <Text style={styles.tableCell}>{entry.ec ?? '–'}</Text>
                    <Text style={styles.tableCell}>{entry.tds ?? '–'}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── StatBox ──
const StatBox = ({ label, value, unit }: { label: string; value: string; unit?: string }) => {
  const COLORS = useTheme();
  const styles = getStyles(COLORS);
  return (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    {unit && <Text style={styles.statUnit}>{unit}</Text>}
    <Text style={styles.statLabel}>{label}</Text>
  </View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontFamily: 'Inter-SemiBold', color: COLORS.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: COLORS.textLight, marginTop: 3, fontFamily: 'Inter-Regular' },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  toggleBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },
  toggleActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primaryBorder },
  toggleText: { fontSize: 12, fontFamily: 'Inter-Medium', color: COLORS.textMuted },
  toggleTextActive: { color: COLORS.primary },

  scroll: { padding: 24 },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 10, fontFamily: 'Inter-SemiBold', color: COLORS.textLight,
    letterSpacing: 1.2, marginBottom: 14,
  },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: {
    width: '47%', backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 18, borderWidth: 1, borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontFamily: 'Inter-Regular', color: COLORS.textPrimary, letterSpacing: -1 },
  statUnit: { fontSize: 10, color: COLORS.textLight, fontFamily: 'Inter-Medium', marginTop: 2, letterSpacing: 0.3 },
  statLabel: {
    fontSize: 10, color: COLORS.textMuted, fontFamily: 'Inter-Medium',
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, textAlign: 'center',
  },

  // Empty
  emptyCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 32,
    borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center',
  },
  emptyText: { color: COLORS.textLight, fontSize: 13, fontFamily: 'Inter-Regular', textAlign: 'center', lineHeight: 20 },

  // Compact list
  compactList: {
    backgroundColor: COLORS.surface, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  compactRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  compactFirst: { borderTopWidth: 0 },
  compactTime: { fontSize: 12, fontFamily: 'Inter-Medium', color: COLORS.textMuted, fontVariant: ['tabular-nums'] },
  compactValues: { flexDirection: 'row', gap: 12 },
  compactValue: { fontSize: 12, fontFamily: 'Inter-SemiBold', fontVariant: ['tabular-nums'] },

  // Table
  table: {
    backgroundColor: COLORS.surface, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: COLORS.surfaceElevated, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tableHeaderCell: {
    flex: 1, fontSize: 10, fontFamily: 'Inter-SemiBold', color: COLORS.textLight,
    textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center',
  },
  tableRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10 },
  tableRowAlt: { backgroundColor: 'rgba(0,0,0,0.01)' },
  tableCell: {
    flex: 1, fontSize: 12, fontFamily: 'Inter-Regular', color: COLORS.textSecondary,
    textAlign: 'center', fontVariant: ['tabular-nums'],
  },
  tableCellTime: { fontFamily: 'Inter-Medium', color: COLORS.textMuted },
});

export default HistoryScreen;
