import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        Alert.alert('Login Failed', error.message);
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <LinearGradient
            colors={['#8B0000', '#CC0000', '#0A0A0A']}
            style={styles.headerGradient}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.gloveEmoji}>🥊</Text>
              <Text style={styles.logoTitle}>HAJIME NO IPPO</Text>
              <Text style={styles.logoSubtitle}>GYM TRACKER</Text>
              <View style={styles.divider} />
              <Text style={styles.motto}>"What does it mean to be strong?"</Text>
            </View>
          </LinearGradient>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>ENTER THE GYM</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.lightGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.darkGray}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.lightGray} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={Colors.darkGray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.lightGray}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>FIGHT! (LOGIN)</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>New to the gym? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>REGISTER</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  gloveEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 4,
    textAlign: 'center',
  },
  logoSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.lightGray,
    letterSpacing: 6,
    marginTop: 4,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: Colors.primary,
    marginVertical: 16,
  },
  motto: {
    fontSize: 13,
    color: Colors.lightGray,
    fontStyle: 'italic',
  },
  form: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.background,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 3,
    marginBottom: 28,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: Colors.white,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: Colors.lightGray,
    fontSize: 14,
  },
  registerLink: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
