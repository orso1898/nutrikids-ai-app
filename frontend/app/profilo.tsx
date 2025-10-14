import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Child {
  id: string;
  name: string;
  age: number;
}

export default function Profilo() {
  const [children, setChildren] = useState<Child[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userEmail, isAdmin, logout } = useAuth();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/children/${userEmail}`);
      setChildren(response.data);
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const addChild = async () => {
    if (!childName.trim()) {
      Alert.alert('Errore', 'Inserisci il nome del bambino');
      return;
    }

    const age = parseInt(childAge);
    if (isNaN(age) || age < 0 || age > 18) {
      Alert.alert('Errore', 'Inserisci un\'età valida (0-18)');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/children`, {
        parent_email: userEmail,
        name: childName.trim(),
        age: age
      });

      setChildName('');
      setChildAge('');
      setModalVisible(false);
      await loadChildren();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiungere il bambino');
      console.error('Error adding child:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChild = async (childId: string, childName: string) => {
    Alert.alert(
      'Conferma',
      `Sei sicuro di voler eliminare ${childName}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/children/${childId}`);
              await loadChildren();
            } catch (error) {
              Alert.alert('Errore', 'Impossibile eliminare il bambino');
              console.error('Error deleting child:', error);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      const confirmLogout = window.confirm('Sei sicuro di voler uscire?');
      if (!confirmLogout) return;
      
      await logout();
      
      // Verifica che sia stato cancellato
      const check1 = await AsyncStorage.getItem('userEmail');
      const check2 = await AsyncStorage.getItem('hasSeenOnboarding');
      
      const message = `Logout Completato!\n\nDati cancellati:\n• Email: ${check1 || 'Cancellata ✅'}\n• Onboarding: ${check2 || 'Cancellato ✅'}\n\nChiudi e riapri l'app.`;
      
      // Try window.alert first, fallback to console
      try {
        window.alert(message);
      } catch (e) {
        console.log(message);
        Alert.alert('Logout Completato', 'Dati cancellati correttamente');
      }
      
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      try {
        window.alert('Errore durante il logout');
      } catch (e) {
        Alert.alert('Errore', 'Errore durante il logout');
      }
    }
  };

  return (
    <LinearGradient colors={['#10b981', '#059669']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profilo</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Ionicons name="person" size={48} color="#10b981" />
            </View>
            <Text style={styles.profileEmail}>{userEmail}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#fff" />
                <Text style={styles.adminText}>Amministratore</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>I Miei Bambini</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addChildButton}>
              <Ionicons name="add-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {children.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nessun bambino aggiunto</Text>
              <Text style={styles.emptySubtext}>Aggiungi un profilo per iniziare</Text>
            </View>
          ) : (
            children.map((child) => (
              <View key={child.id} style={styles.childCard}>
                <View style={styles.childAvatar}>
                  <Text style={styles.childInitial}>{child.name[0].toUpperCase()}</Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childAge}>{child.age} {child.age === 1 ? 'anno' : 'anni'}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteChild(child.id, child.name)}>
                  <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Admin Section - Only visible for admin */}
          {isAdmin && (
            <View style={styles.adminSection}>
              <View style={styles.adminSectionHeader}>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={styles.adminSectionTitle}>Amministrazione</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.adminDashboardButton}
                onPress={() => router.push('/admin-dashboard')}
              >
                <LinearGradient
                  colors={['#7c3aed', '#6d28d9']}
                  style={styles.adminGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="speedometer" size={32} color="#fff" />
                  <Text style={styles.adminDashboardText}>Dashboard Admin</Text>
                  <Text style={styles.adminDashboardSubtext}>Statistiche e gestione</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionButton} onPress={async () => {
              try {
                // Mostra lo stato corrente
                const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
                const savedUserEmail = await AsyncStorage.getItem('userEmail');
                
                const confirmReset = window.confirm(`Stato attuale:\n• Email: ${savedUserEmail || 'Nessuna'}\n• Onboarding visto: ${hasSeenOnboarding || 'No'}\n\nVuoi resettare tutto?`);
                
                if (confirmReset) {
                  // Reset completo
                  await AsyncStorage.removeItem('userEmail');
                  await AsyncStorage.removeItem('hasSeenOnboarding');
                  
                  // Verifica che sia stato cancellato
                  const check1 = await AsyncStorage.getItem('userEmail');
                  const check2 = await AsyncStorage.getItem('hasSeenOnboarding');
                  
                  const message = `Reset Completato!\n\nDati cancellati:\n• Email: ${check1 || 'Cancellata ✅'}\n• Onboarding: ${check2 || 'Cancellato ✅'}\n\nChiudi e riapri l'app.`;
                  
                  try {
                    window.alert(message);
                  } catch (e) {
                    console.log(message);
                    Alert.alert('Reset Completato', 'Dati cancellati correttamente');
                  }
                  
                  router.replace('/');
                }
              } catch (error) {
                try {
                  window.alert(`Errore durante il reset: ${error}`);
                } catch (e) {
                  Alert.alert('Errore', `Errore durante il reset: ${error}`);
                }
              }
            }}>
              <Ionicons name="refresh-outline" size={24} color="#64748b" />
              <Text style={styles.actionText}>Reset App (Test)</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/impostazioni')}>
              <Ionicons name="settings-outline" size={24} color="#64748b" />
              <Text style={styles.actionText}>Impostazioni</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/aiuto')}>
              <Ionicons name="help-circle-outline" size={24} color="#64748b" />
              <Text style={styles.actionText}>Aiuto & Supporto</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/info')}>
              <Ionicons name="information-circle-outline" size={24} color="#64748b" />
              <Text style={styles.actionText}>Info App</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutText}>Esci</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Aggiungi Bambino</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Es: Marco"
                placeholderTextColor="#94a3b8"
                value={childName}
                onChangeText={setChildName}
              />

              <Text style={styles.label}>Età</Text>
              <TextInput
                style={styles.input}
                placeholder="Es: 5"
                placeholderTextColor="#94a3b8"
                value={childAge}
                onChangeText={setChildAge}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={addChild}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Salvataggio...' : 'Salva'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  adminText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addChildButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  childAge: {
    fontSize: 14,
    color: '#64748b',
  },
  actionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  adminSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  adminSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  adminDashboardButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  adminGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  adminDashboardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  adminDashboardSubtext: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 4,
    textAlign: 'center',
  },
});