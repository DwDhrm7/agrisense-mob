// ──────────────────────────────────────────────
// AgriSense · Activity Log Screen
// ──────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '../utils/theme';
import DataStore, { LogEntry } from '../services/DataStore';

type FilterType = 'all' | 'mqtt' | 'sensor' | 'alert' | 'system';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'mqtt', label: 'MQTT' },
  { id: 'sensor', label: 'Sensor' },
  { id: 'alert', label: 'Alert' },
  { id: 'system', label: 'System' },
];

const LogScreen: React.FC = () => {
  const COLORS = useTheme();
  const styles = getStyles(COLORS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setLogs(DataStore.getLogs());
  }, []);

  useEffect(() => {
    refresh();
    const unsub = DataStore.onLogsChange(refresh);
    return unsub;
  }, [refresh]);

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.source === filter);

  const getIndicatorStyle = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return { backgroundColor: COLORS.primary };
      case 'warning': return { backgroundColor: COLORS.warning };
      case 'error': return { backgroundColor: COLORS.error };
      default: return { backgroundColor: COLORS.textLight };
    }
  };

  const clearAll = () => {
    DataStore.clearLogs();
    refresh();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Log Aktivitas</Text>
            <Text style={styles.headerSub}>{logs.length} entri tercatat</Text>
          </View>
          {logs.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll} activeOpacity={0.6}>
              <Text style={styles.clearText}>Hapus</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, filter === f.id && styles.filterActive]}
              onPress={() => setFilter(f.id)} activeOpacity={0.6}>
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true); refresh(); setRefreshing(false);
        }} tintColor={COLORS.primary} />}>

        {filteredLogs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Tidak ada log</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Log akan muncul ketika sistem mulai beroperasi.'
                : `Tidak ada log untuk kategori "${FILTERS.find(f => f.id === filter)?.label}".`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {filteredLogs.map((entry, i) => (
              <View key={entry.id} style={[styles.logItem, i === 0 && styles.logItemFirst]}>
                <View style={[styles.indicator, getIndicatorStyle(entry.level)]} />
                <View style={styles.logContent}>
                  <View style={styles.logTopRow}>
                    <Text style={styles.logTime}>{entry.time}</Text>
                    <View style={styles.sourceTag}>
                      <Text style={styles.sourceText}>{entry.source.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.logMessage}>{entry.message}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface,
    paddingTop: 64,
    paddingBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTitle: { fontSize: 32, fontFamily: 'Outfit-Bold', color: COLORS.textPrimary, letterSpacing: -1 },
  headerSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, fontFamily: 'Inter-Medium' },
  clearBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated, borderWidth: 1.5, borderColor: COLORS.glassBorder,
  },
  clearText: { fontSize: 12, color: COLORS.textPrimary, fontFamily: 'Inter-Bold' },

  filterRow: { paddingHorizontal: 24, gap: 10 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.glassBorder, backgroundColor: COLORS.surfaceElevated,
  },
  filterActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  filterText: { fontSize: 13, fontFamily: 'Inter-Bold', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  filterTextActive: { color: COLORS.background },

  scroll: { padding: 20 },

  emptyCard: {
    backgroundColor: COLORS.surface, borderRadius: 28, padding: 48,
    borderWidth: 1.5, borderColor: COLORS.glassBorder, alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontFamily: 'Outfit-Bold', color: COLORS.textPrimary, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 24, fontFamily: 'Inter-Medium' },

  logList: {
    backgroundColor: COLORS.surface, borderRadius: 28, overflow: 'hidden',
    borderWidth: 1.5, borderColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  logItem: {
    flexDirection: 'row', paddingHorizontal: 22, paddingVertical: 20,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight, gap: 16,
  },
  logItemFirst: { borderTopWidth: 0 },
  indicator: { width: 4, borderRadius: 2, minHeight: 44, backgroundColor: COLORS.border },
  logContent: { flex: 1 },
  logTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logTime: { fontSize: 13, fontFamily: 'Outfit-Bold', color: COLORS.textMuted, fontVariant: ['tabular-nums'] },
  sourceTag: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  sourceText: { fontSize: 10, fontFamily: 'Inter-Bold', color: COLORS.textPrimary, letterSpacing: 1.2 },
  logMessage: { fontSize: 15, color: COLORS.textSecondary, fontFamily: 'Inter-Medium', lineHeight: 22 },
});

export default LogScreen;
