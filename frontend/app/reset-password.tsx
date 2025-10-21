import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [email, setEmail] = useState(params.email as string || '');
  const [resetCode, setResetCode] = useState(params.code as string || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Errore', 'Email mancante');
      return;
    }

    if (!resetCode.trim()) {
      Alert.alert('Errore', 'Inserisci il codice di reset');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Errore', 'Inserisci la nuova password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Errore', 'Le password non corrispondono');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Errore', 'La password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/reset-password`, {
        email: email.trim().toLowerCase(),
        reset_code: resetCode.trim(),
        new_password: newPassword
      });

      Alert.alert(
        '✅ Password Resettata',
        'La tua password è stata modificata con successo!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (error: any) {
      console.error('Reset password error:', error);
      Alert.alert(
        'Errore',
        error.response?.data?.detail || 'Impossibile resettare la password. Verifica il codice.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#10b981', '#059669', '#047857']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={80} color="#fff" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Resetta Password</Text>
          <Text style={styles.subtitle}>
            Inserisci il codice ricevuto e la nuova password
          </Text>

          {/* Email (readonly) */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#059669" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputReadonly]}
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              value={email}
              editable={false}
            />
          </View>

          {/* Reset Code Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="key" size={20} color="#059669" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Codice di Reset (6 cifre)"
              placeholderTextColor="#94a3b8"
              value={resetCode}
              onChangeText={setResetCode}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#059669" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nuova Password"
              placeholderTextColor="#94a3b8"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#059669"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Conferma Password"
              placeholderTextColor="#94a3b8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.submitButtonText}>Resetta Password</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace('/login')}>
            <Text style={styles.backToLoginText}>
              Torna al <Text style={styles.backToLoginLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1e293b',
  },
  inputReadonly: {
    color: '#94a3b8',
  },
  submitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  backToLogin: {
    marginTop: 24,
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  backToLoginLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
