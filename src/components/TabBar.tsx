// ──────────────────────────────────────────────
// AgriSense · Tab Bar Component
// ──────────────────────────────────────────────
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../utils/theme';

export type TabId = 'dashboard' | 'history' | 'log' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: (color: string) => React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Dashboard',
    icon: (color) => (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </Svg>
    ),
  },
  {
    id: 'history',
    label: 'Riwayat',
    shortLabel: 'Riwayat',
    icon: (color) => (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 2v2a8 8 0 1 1-8 8H2a10 10 0 1 0 10-10z" />
        <Path d="M12 6v6l4 2" />
      </Svg>
    ),
  },
  {
    id: 'log',
    label: 'Log',
    shortLabel: 'Log',
    icon: (color) => (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 6h16v0M4 12h16v0M4 18h10v0" />
      </Svg>
    ),
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    shortLabel: 'Setelan',
    icon: (color) => (
      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      </Svg>
    ),
  },
];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  alertCount?: number;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, alertCount = 0 }) => {
  const COLORS = useTheme();
  const styles = typeof getStyles !== "undefined" ? getStyles(COLORS) : {} as any;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const iconColor = isActive ? COLORS.primary : COLORS.textMuted;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.6}>
              <View style={styles.tabContent}>
                {isActive && (
                  <View style={[styles.indicator, styles.indicatorActive]} />
                )}
                
                <View style={[styles.iconContainer, isActive && styles.iconActive]}>
                  {tab.icon(iconColor)}
                </View>

                <Text style={[styles.label, isActive && styles.labelActive]}>
                  {tab.shortLabel}
                </Text>

                {tab.id === 'log' && alertCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {alertCount > 9 ? '9+' : alertCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.glassBorder,
    paddingBottom: 28,
    paddingTop: 14,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    position: 'relative',
    height: 56,
    justifyContent: 'center',
    width: '100%',
  },
  indicator: {
    position: 'absolute',
    bottom: -10,
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textPrimary,
  },
  indicatorActive: {
    display: 'flex',
  },
  iconContainer: {
    marginBottom: 6,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: COLORS.textPrimary,
    fontFamily: 'Outfit-Bold',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 16,
    backgroundColor: COLORS.textPrimary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: COLORS.background,
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
  },
});

export default TabBar;
