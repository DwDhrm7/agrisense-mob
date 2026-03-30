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
import { useMqttMonitor } from './src/hooks/useMqttMonitor';

// Polyfill for Paho MQTT which attempts to access localStorage
// @ts-ignore
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const App = () => {
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

  if (!user) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <SafeAreaView style={styles.root}>
        <View style={styles.screenContainer}>
          {activeTab === 'dashboard' && (
            <DashboardScreen 
              user={user} 
              onLogout={handleLogout} 
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
    backgroundColor: '#f7f8f5',
  },
  screenContainer: {
    flex: 1,
  },
});

export default App;
