// ──────────────────────────────────────────────
// AgriSense · Actuator Control
// ──────────────────────────────────────────────
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../utils/theme';
import DataStore from '../services/DataStore';
import MqttService from '../services/MqttService';

interface ActuatorProps {
  label: string;
  description: string;
  initialState?: boolean;
  topic: string;
}

const DAYS = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];

const ActuatorItem: React.FC<ActuatorProps> = ({ label, description, initialState = false, topic: _topic }) => {
  const COLORS = useTheme();
  const styles = typeof getStyles !== "undefined" ? getStyles(COLORS) : {} as any;

  const [isEnabled, setIsEnabled] = useState(initialState);
  
  const [expanded, setExpanded] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [autoDays, setAutoDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [onTime, setOnTime] = useState('08:00');
  const [offTime, setOffTime] = useState('17:00');

  const toggleSwitch = (val: boolean) => {
    setIsEnabled(val);
    const action = val ? 'ON' : 'OFF';
    DataStore.addLog('info', `${label} (Manual) diubah menjadi ${action}`, 'action');
    MqttService.publishControl(_topic, val);
  };

  const toggleDay = (idx: number) => {
    setAutoDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]);
  };

  return (
    <View style={styles.itemWrapper}>
      <View style={styles.itemContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.itemLabel}>
            {label} {isAuto && <Text style={styles.autoBadge}> • AUTO</Text>}
          </Text>
          <Text style={styles.itemDesc}>{description}</Text>
        </View>
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.otomasiBtn}>{expanded ? 'Tutup' : 'Otomasi'}</Text>
          </TouchableOpacity>
          <Switch
            trackColor={{ false: COLORS.borderLight, true: 'rgba(39, 174, 96, 0.4)' }}
            thumbColor={isEnabled ? COLORS.success : COLORS.textMuted}
            onValueChange={toggleSwitch}
            value={isEnabled}
            disabled={isAuto}
            style={styles.manualSwitch}
          />
        </View>
      </View>

      {expanded && (
        <View style={styles.autoBox}>
          <View style={styles.autoHeader}>
            <Text style={styles.autoTitle}>Jadwal Otomatis</Text>
            <Switch
              value={isAuto}
              onValueChange={(val) => {
                setIsAuto(val);
                DataStore.addLog('info', `Otomasi ${label} ${val ? 'Diaktifkan' : 'Dimatikan'}`, 'system');
              }}
              style={styles.autoSwitch}
            />
          </View>
          
          <View style={isAuto ? styles.autoContentEnabled : styles.autoContentDisabled} pointerEvents={isAuto ? 'auto' : 'none'}>
            <Text style={styles.autoLabel}>HARI AKTIF</Text>
            <View style={styles.daysRow}>
              {DAYS.map((d, i) => {
                const active = autoDays.includes(i);
                return (
                  <TouchableOpacity key={i} style={[styles.dayBtn, active && styles.dayBtnActive]} onPress={() => toggleDay(i)}>
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeGroup}>
                <Text style={styles.autoLabel}>JAM NYALA</Text>
                <TextInput style={styles.timeInput} value={onTime} onChangeText={setOnTime} placeholder="08:00" />
              </View>
              <View style={styles.timeGroup}>
                <Text style={styles.autoLabel}>JAM MATI</Text>
                <TextInput style={styles.timeInput} value={offTime} onChangeText={setOffTime} placeholder="17:00" />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const ActuatorControl: React.FC = () => {
  const COLORS = useTheme();
  const styles = getStyles(COLORS);
  return (
    <View style={styles.card}>
      <ActuatorItem 
        label="Pompa Irigasi" 
        description="Kontrol aliran air nutrisi ke bedengan"
        topic="actuator/pompa"
        initialState={true}
      />
      <View style={styles.divider} />
      <ActuatorItem 
        label="Kipas Sirkulasi Udara" 
        description="Menurunkan suhu mikro dan mencegah jamur"
        topic="actuator/kipas"
        initialState={false}
      />
      <View style={styles.divider} />
      <ActuatorItem 
        label="Lampu Growlight (UV)" 
        description="Kompensasi cahaya matahari di malam hari"
        topic="actuator/growlight"
        initialState={false}
      />
    </View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    padding: 32,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 4,
  },
  itemWrapper: {
    paddingVertical: 4,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  itemLabel: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  autoBadge: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  itemDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
    opacity: 0.8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  manualSwitch: {
    transform: [{ scale: 0.85 }],
  },
  otomasiBtn: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.borderLight,
    marginVertical: 10,
    opacity: 0.5,
  },
  autoBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    padding: 20,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  autoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  autoSwitch: {
    transform: [{ scale: 0.75 }],
  },
  autoContentEnabled: {
    opacity: 1,
  },
  autoContentDisabled: {
    opacity: 0.4,
  },
  autoTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    letterSpacing: -0.3,
  },
  autoLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  dayBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  dayBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: COLORS.textSecondary,
  },
  dayTextActive: {
    color: COLORS.background,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  timeGroup: {
    flex: 1,
  },
  timeInput: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: COLORS.textPrimary,
  },
});

export default ActuatorControl;
