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
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 5,
  },

  // Brand
  brand: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    opacity: 0.7,
  },
  brandName: {
    fontSize: 30,
    fontFamily: 'Inter-Regular',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  brandAccent: {
    fontFamily: 'Outfit-Bold',
    color: COLORS.primary,
  },
  brandTagline: {
    color: COLORS.textLight,
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.5,
  },

  // Form
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: COLORS.textLight,
    fontSize: 10,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.2,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorSoft,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
    fontFamily: 'Inter-Regular',
  },

  // Button
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonLoading: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },

  // Hint
  hint: {
    alignItems: 'center',
    marginTop: 28,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  hintLabel: {
    fontSize: 9,
    color: COLORS.textLight,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  footerLine: {
    width: 24,
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.3,
  },
});

export default LoginScreen;
