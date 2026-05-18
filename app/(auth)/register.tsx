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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    if (!email.trim() || !password || !displayName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            username: username.trim() || displayName.trim().toLowerCase().replace(/\s+/g, '_'),
          },
        },
      });

      if (error) {
        Alert.alert('Registration Failed', error.message);
        return;
      }

      if (data.user) {
        // Create profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName.trim(),
          username: username.trim() || displayName.trim().toLowerCase().replace(/\s+/g, '_'),
          xp: 0,
          rank_level: 0,
        });
      }

      Alert.alert(
        'Welcome to the Gym!',
        'Your journey begins now. Train hard and climb the ranks!',
        [{ text: 'LET\'S GO!', onPress: () => router.replace('/(tabs)') }]
      );
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
          <LinearGradient
            colors={['#8B0000', '#CC0000', '#0A0A0A']}
            style={styles.headerGradient}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text style={styles.gloveEmoji}>🥊</Text>
              <Text style={styles.logoTitle}>JOIN THE GYM</Text>
              <Text style={styles.logoSubtitle}>BEGIN YOUR JOURNEY</Text>
            </View>
          </LinearGradient>

          <View style={styles.form}>
            <Text style={styles.formTitle}>CREATE ACCOUNT</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.lightGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Display Name *"
                placeholderTextColor={Colors.darkGray}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="at-outline" size={20} color={Colors.lightGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username (optional)"
                placeholderTextColor={Colors.darkGray}
                value={username}
                onChangeText={text => setUsername(text.toLowerCase().replace(/\s+/g, '_'))}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.lightGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor={Colors.darkGray}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.lightGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password *"
                placeholderTextColor={Colors.darkGray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.lightGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password *"
                placeholderTextColor={Colors.darkGray}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.registerButtonText}>START TRAINING</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already a member? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLink}>LOGIN</Text>
              </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 50,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  gloveEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  logoTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 4,
  },
  logoSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.lightGray,
    letterSpacing: 4,
    marginTop: 4,
  },
  form: {
    flex: 1,
    padding: 24,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: Colors.background,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 3,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
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
  registerButton: {
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
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: Colors.lightGray,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
