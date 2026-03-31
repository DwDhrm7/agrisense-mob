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
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 24,
  },
  headerTitle: { fontSize: 20, fontFamily: 'Inter-SemiBold', color: COLORS.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: COLORS.textLight, marginTop: 3, fontFamily: 'Inter-Regular' },
  clearBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },
  clearText: { fontSize: 11, color: COLORS.textMuted, fontFamily: 'Inter-Medium' },

  filterRow: { paddingHorizontal: 24, gap: 8, marginTop: 14 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  filterActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primaryBorder },
  filterText: { fontSize: 12, fontFamily: 'Inter-Medium', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.primary },

  scroll: { padding: 24 },

  emptyCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 40,
    borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center',
  },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: COLORS.textPrimary, marginBottom: 6 },
  emptyText: { color: COLORS.textLight, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  logList: {
    backgroundColor: COLORS.surface, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  logItem: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight, gap: 12,
  },
  logItemFirst: { borderTopWidth: 0 },
  indicator: { width: 3, borderRadius: 1.5, minHeight: 24 },
  logContent: { flex: 1 },
  logTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  logTime: { fontSize: 11, fontFamily: 'Inter-Medium', color: COLORS.textLight, fontVariant: ['tabular-nums'] },
  sourceTag: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3,
    backgroundColor: COLORS.background,
  },
  sourceText: { fontSize: 9, fontFamily: 'Inter-SemiBold', color: COLORS.textLight, letterSpacing: 0.5 },
  logMessage: { fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Inter-Regular', lineHeight: 19 },
});

export default LogScreen;
