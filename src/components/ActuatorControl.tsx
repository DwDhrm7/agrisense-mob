// ──────────────────────────────────────────────
// AgriSense · Actuator Control
// ──────────────────────────────────────────────
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../utils/config';
import DataStore from '../services/DataStore';
// import MqttService from '../services/MqttService';

interface ActuatorProps {
  label: string;
  description: string;
  initialState?: boolean;
  topic: string;
}

const DAYS = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];

const ActuatorItem: React.FC<ActuatorProps> = ({ label, description, initialState = false, topic }) => {
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
            thumbColor={isEnabled ? COLORS.success : '#f4f3f4'}
            onValueChange={toggleSwitch}
            value={isEnabled}
            disabled={isAuto}
            style={{ transform: [{ scale: 0.85 }] }}
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
              style={{ transform: [{ scale: 0.75 }] }}
            />
          </View>
          
          <View style={{ opacity: isAuto ? 1 : 0.4 }} pointerEvents={isAuto ? 'auto' : 'none'}>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  itemWrapper: {
    paddingVertical: 4,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  itemLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  autoBadge: {
    color: COLORS.primary,
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
  itemDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  otomasiBtn: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  autoBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  autoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  autoTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  autoLabel: {
    fontSize: 9,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textLight,
    letterSpacing: 1,
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dayBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
  },
  dayTextActive: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeGroup: {
    flex: 1,
  },
  timeInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
  },
});

export default ActuatorControl;
