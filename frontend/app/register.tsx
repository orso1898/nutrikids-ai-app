import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams();

  // Pre-compila il codice referral se arriva da un link
  useEffect(() => {
    if (params.ref && typeof params.ref === 'string') {
      setReferralCode(params.ref.toUpperCase());
    }
  }, [params.ref]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // Validazioni
    if (!email.trim()) {
      try {
        window.alert('Inserisci un\'email valida');
      } catch (e) {
        Alert.alert(t('error'), 'Inserisci un\'email valida');
      }
      return;
    }

    if (!validateEmail(email)) {
      try {
        window.alert('Formato email non valido');
      } catch (e) {
        Alert.alert(t('error'), 'Formato email non valido');
      }
      return;
    }

    if (!password.trim() || password.length < 6) {
      try {
        window.alert('La password deve essere almeno 6 caratteri');
      } catch (e) {
        Alert.alert(t('error'), 'Password troppo corta (min 6 caratteri)');
      }
      return;
    }

    if (password !== confirmPassword) {
      try {
        window.alert('Le password non coincidono');
      } catch (e) {
        Alert.alert(t('error'), 'Le password non coincidono');
      }
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Attempting registration for:', email);
      
      // Call backend API to register
      const response = await axios.post(`${BACKEND_URL}/api/register`, {
        email: email,
        password: password,
        name: name.trim() || null,
        referral_code: referralCode.trim() || null
      });
      
      console.log('✅ Registration successful:', response.data);
      
      // Show success message
      try {
        window.alert('Registrazione completata! Ora puoi fare il login.');
      } catch (e) {
        Alert.alert(t('success'), 'Registrazione completata!');
      }
      
      // Navigate to login
      router.push('/login');
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Errore durante la registrazione';
      if (error.response?.status === 400) {
        errorMessage = 'Email già registrata';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      try {
        window.alert(errorMessage);
      } catch (e) {
        Alert.alert(t('error'), errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#10b981', '#059669']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="person-add" size={48} color="#fff" />
                </View>
                <Text style={styles.appName}>Crea Account</Text>
                <Text style={styles.subtitle}>Unisciti a NutriKids AI</Text>
              </View>

              <View style={styles.formContainer}>
                {/* Nome (opzionale) */}
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color="#10b981" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nome (opzionale)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Ionicons name="mail" size={20} color="#10b981" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color="#10b981" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password (min 6 caratteri)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#64748b" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Conferma Password */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color="#10b981" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Conferma Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#64748b" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Codice Referral (Opzionale) */}
                <View style={styles.inputContainer}>
                  <Ionicons name="gift" size={20} color="#eab308" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Codice invito (opzionale) - Ottieni Premium gratis! 🎁"
                    value={referralCode}
                    onChangeText={(text) => setReferralCode(text.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={8}
                  />
                  {referralCode.length > 0 && (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" style={styles.eyeIcon} />
                  )}
                </View>
                {referralCode.length > 0 && (
                  <Text style={styles.referralHint}>
                    🎉 Con questo codice, aiuterai un amico a ottenere Premium gratis!
                  </Text>
                )}

                <TouchableOpacity 
                  style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <Text style={styles.registerButtonText}>{t('loading')}</Text>
                  ) : (
                    <>
                      <Text style={styles.registerButtonText}>Registrati</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>{t('register.haveAccount')} </Text>
                  <TouchableOpacity onPress={() => router.push('/login')}>
                    <Text style={styles.loginLink}>{t('register.loginLink')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 8,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  registerButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  loginLink: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  referralHint: {
    fontSize: 12,
    color: '#eab308',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 40,
    fontStyle: 'italic',
  },
});
