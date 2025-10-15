import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface AppConfig {
  emergent_llm_key: string;
  premium_monthly_price: number;
  premium_yearly_price: number;
  openai_model: string;
  vision_model: string;
  max_free_scans: number;
}

export default function AdminConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { isAdmin, userEmail } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/home');
      return;
    }
    loadConfig();
  }, [isAdmin]);

  const loadConfig = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/config`, {
        headers: {
          'X-User-Email': userEmail || ''
        }
      });
      console.log('Config loaded:', response.data);
      setConfig(response.data);
    } catch (error: any) {
      console.error('Error loading config:', error);
      const errorMsg = error.response?.data?.detail || 'Errore nel caricamento delle configurazioni';
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
    if (!config) return;
    
    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/admin/config`, config, {
        headers: {
          'X-User-Email': userEmail || ''
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
              <Text style={styles.sectionTitle}>API Keys & Modelli</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Emergent LLM Key</Text>
              <TextInput
                style={styles.input}
                value={config.emergent_llm_key}
                onChangeText={(value) => updateField('emergent_llm_key', value)}
                placeholder="sk-emergent-..."
                secureTextEntry
              />
              
              <Text style={styles.label}>Modello Chat (Coach Maya)</Text>
              <TextInput
                style={styles.input}
                value={config.openai_model}
                onChangeText={(value) => updateField('openai_model', value)}
                placeholder="gpt-4o-mini"
              />

              <Text style={styles.label}>Modello Vision (Scanner)</Text>
              <TextInput
                style={styles.input}
                value={config.vision_model}
                onChangeText={(value) => updateField('vision_model', value)}
                placeholder="gpt-4o"
              />
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

          {/* Limits */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={20} color="#fff" />
              <Text style={styles.sectionTitle}>Limiti & Restrizioni</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Max Scan Gratuiti</Text>
              <TextInput
                style={styles.input}
                value={config.max_free_scans.toString()}
                onChangeText={(value) => updateField('max_free_scans', parseInt(value) || 0)}
                keyboardType="number-pad"
                placeholder="5"
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={16} color="#7c3aed" />
                <Text style={styles.infoText}>
                  Numero massimo di scansioni AI gratuite per utente
                </Text>
              </View>
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
});
