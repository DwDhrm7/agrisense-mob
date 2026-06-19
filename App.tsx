import React, { useState } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LogScreen from './src/screens/LogScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TabBar, { TabId } from './src/components/TabBar';
import MqttService from './src/services/MqttService';
import { useMqttMonitor } from './src/hooks/useMqttMonitorHook';
import { useTheme } from './src/utils/theme';

// Polyfill for Paho MQTT which attempts to access localStorage
// @ts-ignore
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const App = () => {
  const COLORS = useTheme();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  
  // MQTT is now managed universally across tabs
  const mqttState = useMqttMonitor();

  const handleLogin = (userData: any) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    MqttService.disconnect();
    setUser(null);
    setActiveTab('dashboard');
  };

  // Reset alert badge when opening log tab
  const handleTabChange = (tab: TabId) => {
    if (tab === 'log') mqttState.setAlertCount(0);
    setActiveTab(tab);
  };

  const isDark = COLORS.background !== '#F9FBF9'; // Simple check for dark mode

  if (!user) {
    return (
      <SafeAreaProvider>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={COLORS.background} 
          translucent={false} 
        />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={COLORS.background} 
        translucent={false} 
      />
      <SafeAreaView style={[styles.root, { backgroundColor: COLORS.background }]}>
        <View style={styles.screenContainer}>
          {activeTab === 'dashboard' && (
            <DashboardScreen 
              user={user} 
              status={mqttState.status}
              sensors={mqttState.sensors}
              lastUpdate={mqttState.lastUpdate}
              alerts={mqttState.alerts}
              historyXY={mqttState.historyXY}
            />
          )}
          {activeTab === 'history' && <HistoryScreen />}
          {activeTab === 'log' && <LogScreen />}
          {activeTab === 'settings' && (
            <SettingsScreen
              user={user}
              connectionStatus={mqttState.status}
              onLogout={handleLogout}
            />
          )}
        </View>
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} alertCount={mqttState.alertCount} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});

export default App;
