// ──────────────────────────────────────────────
// AgriSense · Data Store (In-Memory + Shared)
// ──────────────────────────────────────────────
// Central data store for sensor history, activity
// logs, and shared state across all screens.
// ──────────────────────────────────────────────

export interface HistoryEntry {
  time: string;
  timestamp: number;
  suhu: number | null;
  kelembapan: number | null;
  ec: number | null;
  tds: number | null;
  suhuAir: number | null;
}

export interface LogEntry {
  id: string;
  time: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  source: string; // 'mqtt' | 'sensor' | 'weather' | 'system' | 'alert'
}

const HISTORY_MAX = 100;
const LOG_MAX = 200;

class DataStore {
  private history: HistoryEntry[] = [];
  private logs: LogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private logListeners: Set<() => void> = new Set();

  // ─── History ────────────────────────────────

  pushHistory(entry: Omit<HistoryEntry, 'timestamp'>) {
    this.history.push({ ...entry, timestamp: Date.now() });
    if (this.history.length > HISTORY_MAX) this.history.shift();
    this._notifyHistory();
  }

  getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  getRecentHistory(count: number): HistoryEntry[] {
    return this.history.slice(-count);
  }

  clearHistory() {
    this.history = [];
    this._notifyHistory();
  }

  onHistoryChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private _notifyHistory() {
    this.listeners.forEach(fn => fn());
  }

  // ─── Logs ───────────────────────────────────

  addLog(level: LogEntry['level'], message: string, source: LogEntry['source'] = 'system') {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' +
      now.getMinutes().toString().padStart(2, '0') + ':' +
      now.getSeconds().toString().padStart(2, '0');

    this.logs.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time,
      timestamp: Date.now(),
      level,
      message,
      source,
    });

    if (this.logs.length > LOG_MAX) this.logs.pop();
    this._notifyLogs();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsBySource(source: string): LogEntry[] {
    return this.logs.filter(l => l.source === source);
  }

  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(l => l.level === level);
  }

  clearLogs() {
    this.logs = [];
    this._notifyLogs();
  }

  onLogsChange(fn: () => void): () => void {
    this.logListeners.add(fn);
    return () => { this.logListeners.delete(fn); };
  }

  private _notifyLogs() {
    this.logListeners.forEach(fn => fn());
  }

  // ─── Stats ──────────────────────────────────

  getStats() {
    const h = this.history;
    if (h.length === 0) {
      return {
        totalReadings: 0,
        uptime: '–',
        avgSuhu: null,
        avgKelembapan: null,
        avgEc: null,
        minSuhu: null,
        maxSuhu: null,
        minKelembapan: null,
        maxKelembapan: null,
      };
    }

    const suhuVals = h.map(e => e.suhu).filter((v): v is number => v !== null);
    const humVals = h.map(e => e.kelembapan).filter((v): v is number => v !== null);
    const ecVals = h.map(e => e.ec).filter((v): v is number => v !== null);

    const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
    const min = (arr: number[]) => arr.length ? Math.round(Math.min(...arr) * 10) / 10 : null;
    const max = (arr: number[]) => arr.length ? Math.round(Math.max(...arr) * 10) / 10 : null;

    const firstTs = h[0]?.timestamp ?? Date.now();
    const elapsed = Date.now() - firstTs;
    const mins = Math.floor(elapsed / 60000);
    const uptime = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;

    return {
      totalReadings: h.length,
      uptime,
      avgSuhu: avg(suhuVals),
      avgKelembapan: avg(humVals),
      avgEc: avg(ecVals),
      minSuhu: min(suhuVals),
      maxSuhu: max(suhuVals),
      minKelembapan: min(humVals),
      maxKelembapan: max(humVals),
    };
  }
}

export default new DataStore();
