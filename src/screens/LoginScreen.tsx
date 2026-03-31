// ──────────────────────────────────────────────
// AgriSense · Login Screen — Premium
// ──────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, KeyboardAvoidingView, Animated, Easing, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { USERS } from '../utils/config';
import { useTheme } from '../utils/theme';

interface LoginScreenProps {
  onLogin: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const COLORS = useTheme();
  const styles = typeof getStyles !== "undefined" ? getStyles(COLORS) : {} as any;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = () => {
    const user = USERS[username.trim()];
    if (user && user.password === password) {
      setError(false);
      setLoading(true);
      setTimeout(() => {
        onLogin({ username: username.trim(), ...user });
        setLoading(false);
      }, 350);
    } else {
      setError(true);
      setPassword('');
      shake();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] },
          ]}>

          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={{ width: 48, height: 48, borderRadius: 24 }} 
                resizeMode="cover" 
              />
            </View>
            <Text style={styles.brandName}>
              Agri<Text style={styles.brandAccent}>Sense</Text>
            </Text>
            <Text style={styles.brandTagline}>Smart Farm Monitoring System</Text>
          </View>

          {/* Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Masukkan username"
              placeholderTextColor={COLORS.textLight}
              value={username}
              onChangeText={(t) => { setUsername(t); setError(false); }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Masukkan password"
              placeholderTextColor={COLORS.textLight}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(false); }}
              secureTextEntry
              autoCorrect={false}
              editable={!loading}
              onSubmitEditing={handleLogin}
            />
          </View>

          {error && (
            <Text style={styles.errorText}>
              Username atau password salah
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonLoading]}
            onPress={handleLogin}
            activeOpacity={0.7}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'Memproses...' : 'Masuk'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>© 2026 AgriSense</Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 36,
    paddingHorizontal: 40,
    paddingVertical: 56,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 8,
  },

  // Brand
  brand: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  brandName: {
    fontSize: 36,
    fontFamily: 'Outfit-Bold',
    color: COLORS.textPrimary,
    letterSpacing: -1.2,
  },
  brandAccent: {
    color: COLORS.textMuted,
  },
  brandTagline: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Form
  formGroup: {
    marginBottom: 28,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 10,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    borderRadius: 18,
    color: COLORS.textPrimary,
    paddingHorizontal: 22,
    paddingVertical: 18,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorSoft,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter-Bold',
  },

  // Button
  button: {
    backgroundColor: COLORS.textPrimary,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.glassShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    marginTop: 44,
    alignItems: 'center',
  },
  footerLine: {
    width: 40,
    height: 1.5,
    backgroundColor: COLORS.borderLight,
    marginBottom: 20,
    opacity: 0.5,
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

export default LoginScreen;
