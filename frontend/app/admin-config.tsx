import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://foodcoach-android.preview.emergentagent.com';

interface AppConfig {
  emergent_llm_key: string;
  premium_monthly_price: number;
  premium_yearly_price: number;
  openai_model: string;
  vision_model: string;
  // Provider AI
  chat_provider: string;
  vision_provider: string;
  // API Keys servizi esterni
  stripe_publishable_key: string;
  stripe_secret_key: string;
  brevo_api_key: string;
  // API Keys AI (per produzione)
  openai_api_key: string;
  google_api_key: string;
  anthropic_api_key: string;
  // Limiti FREE
  max_free_scans_daily: number;
  max_free_coach_messages_daily: number;
  max_free_children: number;
  // Limiti PREMIUM
  max_premium_scans_daily: number;
  max_premium_coach_messages_daily: number;
  max_premium_children: number;
}

// Opzioni AI disponibili
const AI_PROVIDERS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Google Gemini', value: 'gemini' },
  { label: 'Anthropic Claude', value: 'anthropic' },
];

const CHAT_MODELS = {
  openai: [
    { label: 'GPT-4o (Top)', value: 'gpt-4o' },
    { label: 'GPT-4o Mini (Economico)', value: 'gpt-4o-mini' },
    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
  ],
  gemini: [
    { label: 'Gemini 1.5 Pro (Top)', value: 'gemini-1.5-pro' },
    { label: 'Gemini 2.0 Flash (Economico)', value: 'gemini-2.0-flash' },
  ],
  anthropic: [
    { label: 'Claude 3.5 Sonnet (Top)', value: 'claude-3-5-sonnet-latest' },
    { label: 'Claude 3 Haiku (Economico)', value: 'claude-3-haiku-20240307' },
  ],
};

const VISION_MODELS = {
  openai: [
    { label: 'GPT-4o Vision (Top)', value: 'gpt-4o' },
    { label: 'GPT-4o Mini Vision', value: 'gpt-4o-mini' },
  ],
  gemini: [
    { label: 'Gemini 1.5 Pro Vision (Top)', value: 'gemini-1.5-pro' },
    { label: 'Gemini 2.0 Flash Vision (Economico)', value: 'gemini-2.0-flash' },
  ],
  anthropic: [
    { label: 'Claude 3.5 Sonnet Vision (Top)', value: 'claude-3-5-sonnet-latest' },
    { label: 'Claude 3 Haiku Vision', value: 'claude-3-haiku-20240307' },
  ],
};

export default function AdminConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const router = useRouter();
  const { isAdmin, userEmail, authToken } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/home');
      return;
    }
    loadConfig();
  }, [isAdmin]);

  const loadConfig = async () => {
    try {
      if (!authToken) {
        router.replace('/login');
        return;
      }
      
      const response = await axios.get(`${BACKEND_URL}/api/admin/config`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('Config loaded:', response.data);
      setConfig(response.data);
    } catch (error: any) {
      console.error('Error loading config:', error);
      const errorMsg = error.response?.data?.detail || 'Errore nel caricamento delle configurazioni';
      
      // Se errore di autenticazione, redirect al login
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.replace('/login');
        return;
      }
      
      try {
        window.alert(errorMsg);
      } catch (e) {
        Alert.alert('Errore', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config || !authToken) return;
    
    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/admin/config`, config, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      try {
        window.alert('Configurazioni salvate con successo! ✅');
      } catch (e) {
        Alert.alert('Successo', 'Configurazioni salvate!');
      }
    } catch (error: any) {
      console.error('Error saving config:', error);
      const errorMsg = error.response?.data?.detail || 'Errore durante il salvataggio';
      try {
        window.alert(errorMsg);
      } catch (e) {
        Alert.alert('Errore', errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof AppConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  const changePassword = async () => {
    // Validazione
    if (!currentPassword || !newPassword || !confirmPassword) {
      try {
        window.alert('Compila tutti i campi');
      } catch (e) {
        Alert.alert('Errore', 'Compila tutti i campi');
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      try {
        window.alert('Le password non corrispondono');
      } catch (e) {
        Alert.alert('Errore', 'Le password non corrispondono');
      }
      return;
    }

    if (newPassword.length < 6) {
      try {
        window.alert('La nuova password deve essere di almeno 6 caratteri');
      } catch (e) {
        Alert.alert('Errore', 'La nuova password deve essere di almeno 6 caratteri');
      }
      return;
    }

    setChangingPassword(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/change-password`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      try {
        window.alert('Password cambiata con successo! 🔐');
      } catch (e) {
        Alert.alert('Successo', 'Password cambiata con successo!');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMsg = error.response?.data?.detail || 'Errore durante il cambio password';
      try {
        window.alert(errorMsg);
      } catch (e) {
        Alert.alert('Errore', errorMsg);
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Caricamento configurazioni...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Configurazioni App</Text>
            <Text style={styles.headerSubtitle}>Gestisci API keys, prezzi e impostazioni</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* API Configuration */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="key" size={20} color="#fff" />
              <Text style={styles.sectionTitle}>🤖 Configurazione AI</Text>
            </View>

            <View style={styles.card}>
              {/* COACH MAYA - Chat AI */}
              <View style={styles.aiSection}>
                <Text style={styles.aiSectionTitle}>💬 Coach Maya (Chat)</Text>
                
                <Text style={styles.label}>Provider</Text>
                <View style={styles.buttonGroup}>
                  {AI_PROVIDERS.map((provider) => (
                    <TouchableOpacity
                      key={provider.value}
                      style={[
                        styles.providerButton,
                        (config.chat_provider || 'openai') === provider.value && styles.providerButtonActive
                      ]}
                      onPress={() => {
                        updateField('chat_provider', provider.value);
                        // Reset model when changing provider
                        const defaultModel = CHAT_MODELS[provider.value as keyof typeof CHAT_MODELS]?.[0]?.value || '';
                        updateField('openai_model', defaultModel);
                      }}
                    >
                      <Text style={[
                        styles.providerButtonText,
                        (config.chat_provider || 'openai') === provider.value && styles.providerButtonTextActive
                      ]}>{provider.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Modello</Text>
                <View style={styles.modelList}>
                  {CHAT_MODELS[(config.chat_provider || 'openai') as keyof typeof CHAT_MODELS]?.map((model) => (
                    <TouchableOpacity
                      key={model.value}
                      style={[
                        styles.modelButton,
                        config.openai_model === model.value && styles.modelButtonActive
                      ]}
                      onPress={() => updateField('openai_model', model.value)}
                    >
                      <Text style={[
                        styles.modelButtonText,
                        config.openai_model === model.value && styles.modelButtonTextActive
                      ]}>{model.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* SCANNER - Vision AI */}
              <View style={[styles.aiSection, { marginTop: 24 }]}>
                <Text style={styles.aiSectionTitle}>📸 Scanner (Vision)</Text>
                
                <Text style={styles.label}>Provider</Text>
                <View style={styles.buttonGroup}>
                  {AI_PROVIDERS.map((provider) => (
                    <TouchableOpacity
                      key={provider.value}
                      style={[
                        styles.providerButton,
                        (config.vision_provider || 'gemini') === provider.value && styles.providerButtonActive
                      ]}
                      onPress={() => {
                        updateField('vision_provider', provider.value);
                        const defaultModel = VISION_MODELS[provider.value as keyof typeof VISION_MODELS]?.[0]?.value || '';
                        updateField('vision_model', defaultModel);
                      }}
                    >
                      <Text style={[
                        styles.providerButtonText,
                        (config.vision_provider || 'gemini') === provider.value && styles.providerButtonTextActive
                      ]}>{provider.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Modello</Text>
                <View style={styles.modelList}>
                  {VISION_MODELS[(config.vision_provider || 'gemini') as keyof typeof VISION_MODELS]?.map((model) => (
                    <TouchableOpacity
                      key={model.value}
                      style={[
                        styles.modelButton,
                        config.vision_model === model.value && styles.modelButtonActive
                      ]}
                      onPress={() => updateField('vision_model', model.value)}
                    >
                      <Text style={[
                        styles.modelButtonText,
                        config.vision_model === model.value && styles.modelButtonTextActive
                      ]}>{model.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Current Config Summary */}
              <View style={styles.configSummary}>
                <Text style={styles.configSummaryTitle}>⚙️ Configurazione Attuale:</Text>
                <Text style={styles.configSummaryText}>
                  Coach: {config.chat_provider || 'openai'} / {config.openai_model || 'gpt-4o-mini'}
                </Text>
                <Text style={styles.configSummaryText}>
                  Scanner: {config.vision_provider || 'gemini'} / {config.vision_model || 'gemini-2.0-flash'}
                </Text>
              </View>
            </View>
          </View>

          {/* API Keys */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="key" size={20} color="#fff" />
              <Text style={styles.sectionTitle}>🔑 API Keys</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Emergent LLM Key (Sviluppo)</Text>
              <TextInput
                style={styles.input}
                value={config.emergent_llm_key}
                onChangeText={(value) => updateField('emergent_llm_key', value)}
                placeholder="ek-..."
                placeholderTextColor="rgba(0,0,0,0.4)"
              />
              <Text style={styles.helpTextSmall}>Usata per sviluppo su Emergent</Text>

              <Text style={[styles.label, { marginTop: 16 }]}>OpenAI API Key (Produzione)</Text>
              <TextInput
                style={styles.input}
                value={config.openai_api_key || ''}
                onChangeText={(value) => updateField('openai_api_key', value)}
                placeholder="sk-..."
                placeholderTextColor="rgba(0,0,0,0.4)"
              />

              <Text style={styles.label}>Google AI Key (Produzione)</Text>
              <TextInput
                style={styles.input}
                value={config.google_api_key || ''}
                onChangeText={(value) => updateField('google_api_key', value)}
                placeholder="AIza..."
                placeholderTextColor="rgba(0,0,0,0.4)"
              />

              <Text style={styles.label}>Anthropic API Key (Produzione)</Text>
              <TextInput
                style={styles.input}
                value={config.anthropic_api_key || ''}
                onChangeText={(value) => updateField('anthropic_api_key', value)}
                placeholder="sk-ant-..."
                placeholderTextColor="rgba(0,0,0,0.4)"
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color="#3b82f6" />
                <Text style={styles.infoText}>
                  In produzione, se inserisci una API key specifica (OpenAI/Google/Anthropic), verrà usata quella invece di Emergent Key.
                </Text>
              </View>
            </View>
          </View>

          {/* Stripe & Email Configuration */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card" size={20} color="#fff" />
              <Text style={styles.sectionTitle}>Servizi Esterni</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Stripe Publishable Key</Text>
              <TextInput
                style={styles.input}
                value={config.stripe_publishable_key || ''}
                onChangeText={(value) => updateField('stripe_publishable_key', value)}
                placeholder="pk_live_..."
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text style={styles.helpText}>Chiave pubblica per pagamenti Stripe (frontend)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Stripe Secret Key</Text>
              <TextInput
                style={styles.input}
                value={config.stripe_secret_key || ''}
                onChangeText={(value) => updateField('stripe_secret_key', value)}
                placeholder="sk_live_..."
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text style={styles.helpText}>Chiave segreta per pagamenti Stripe (backend)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Brevo API Key</Text>
              <TextInput
                style={styles.input}
                value={config.brevo_api_key || ''}
                onChangeText={(value) => updateField('brevo_api_key', value)}
                placeholder="xkeysib-..."
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text style={styles.helpText}>Per invio email di recupero password</Text>
            </View>

            <View style={styles.warningCard}>
              <Ionicons name="shield-checkmark" size={20} color="#10b981" />
              <Text style={styles.warningText}>
                🔒 Le API keys vengono salvate in modo sicuro nel database
              </Text>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={20} color="#fff" />
              <Text style={styles.sectionTitle}>Prezzi Premium</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Prezzo Mensile (€)</Text>
              <TextInput
                style={styles.input}
                value={config.premium_monthly_price.toString()}
                onChangeText={(value) => updateField('premium_monthly_price', parseFloat(value) || 0)}
                keyboardType="decimal-pad"
                placeholder="9.99"
              />

              <Text style={styles.label}>Prezzo Annuale (€)</Text>
              <TextInput
                style={styles.input}
                value={config.premium_yearly_price.toString()}
                onChangeText={(value) => updateField('premium_yearly_price', parseFloat(value) || 0)}
                keyboardType="decimal-pad"
                placeholder="71.88"
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={16} color="#7c3aed" />
                <Text style={styles.infoText}>
                  Risparmio annuale: €{((config.premium_monthly_price * 12) - config.premium_yearly_price).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* FREE User Limits */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color="#fff" />
              <Text style={styles.sectionTitle}>Limiti Utenti FREE</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Scansioni Giornaliere</Text>
              <TextInput
                style={styles.input}
                value={config.max_free_scans_daily?.toString() || '3'}
                onChangeText={(value) => updateField('max_free_scans_daily', parseInt(value) || 0)}
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text style={styles.helpText}>Numero massimo di scansioni al giorno per utenti free</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Messaggi Coach Maya Giornalieri</Text>
              <TextInput
                style={styles.input}
                value={config.max_free_coach_messages_daily?.toString() || '8'}
                onChangeText={(value) => updateField('max_free_coach_messages_daily', parseInt(value) || 0)}
                keyboardType="number-pad"
                placeholder="8"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text style={styles.helpText}>Numero massimo di messaggi al giorno per Coach Maya (free)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bambini Massimi</Text>
              <TextInput
                style={styles.input}
                value={config.max_free_children?.toString() || '2'}
                onChangeText={(value) => updateField('max_free_children', parseInt(value) || 0)}
                keyboardType="number-pad"
                placeholder="2"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text style={styles.helpText}>Numero massimo di profili bambini per utenti free</Text>
            </View>
          </View>

          {/* PREMIUM User Limits */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="diamond" size={20} color="#fff" />
              <Text style={styles.sectionTitle}>Limiti Utenti PREMIUM</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Scansioni Giornaliere</Text>
              <TextInput
                style={styles.input}
                value={config.max_premium_scans_daily?.toString() || '0'}
                onChangeText={(value) => updateField('max_premium_scans_daily', parseInt(value) || 0)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text style={styles.helpText}>Scansioni al giorno (0 = illimitato)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Messaggi Coach Maya Giornalieri</Text>
              <TextInput
                style={styles.input}
                value={config.max_premium_coach_messages_daily?.toString() || '0'}
                onChangeText={(value) => updateField('max_premium_coach_messages_daily', parseInt(value) || 0)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text style={styles.helpText}>Messaggi al giorno per Coach Maya (0 = illimitato)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bambini Massimi</Text>
              <TextInput
                style={styles.input}
                value={config.max_premium_children?.toString() || '0'}
                onChangeText={(value) => updateField('max_premium_children', parseInt(value) || 0)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text style={styles.helpText}>Profili bambini (0 = illimitato)</Text>
            </View>

            <View style={styles.warningCard}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.warningText}>
                💡 Imposta 0 per limiti illimitati per gli utenti Premium
              </Text>
            </View>
          </View>

          {/* Current Values Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="eye" size={20} color="#fff" />
              <Text style={styles.sectionTitle}>Valori Attuali</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Modello Chat:</Text>
                <Text style={styles.infoValue}>{config.openai_model}</Text>
              </View>
              
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Modello Vision:</Text>
                <Text style={styles.infoValue}>{config.vision_model}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Premium Mensile:</Text>
                <Text style={styles.infoValue}>€{config.premium_monthly_price.toFixed(2)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Premium Annuale:</Text>
                <Text style={styles.infoValue}>€{config.premium_yearly_price.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Password Change Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed" size={20} color="#fff" />
              <Text style={styles.sectionTitle}>Sicurezza Account</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password Attuale</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Inserisci password attuale"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showCurrentPassword ? 'eye-off' : 'eye'} 
                    size={24} 
                    color="rgba(255,255,255,0.7)" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nuova Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Inserisci nuova password (min 6 caratteri)"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showNewPassword ? 'eye-off' : 'eye'} 
                    size={24} 
                    color="rgba(255,255,255,0.7)" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Conferma Nuova Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Conferma nuova password"
                placeholderTextColor="rgba(255,255,255,0.5)"
                secureTextEntry={true}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.changePasswordButton, changingPassword && styles.saveButtonDisabled]}
              onPress={changePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="key" size={20} color="#fff" />
                  <Text style={styles.changePasswordButtonText}>Cambia Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveConfig}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Salva Configurazioni</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.warningText}>
              Attenzione: Le modifiche alle API keys richiedono il riavvio del backend per essere applicate completamente.
            </Text>
          </View>
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#7c3aed',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  helpTextSmall: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  aiSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
  },
  aiSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  providerButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  providerButtonActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  providerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  providerButtonTextActive: {
    color: '#fff',
  },
  modelList: {
    gap: 8,
  },
  modelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modelButtonActive: {
    backgroundColor: '#ede9fe',
    borderColor: '#7c3aed',
  },
  modelButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  modelButtonTextActive: {
    color: '#7c3aed',
    fontWeight: '600',
  },
  configSummary: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  configSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  configSummaryText: {
    fontSize: 13,
    color: '#15803d',
    fontFamily: 'monospace',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  eyeButton: {
    padding: 12,
  },
  changePasswordButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
