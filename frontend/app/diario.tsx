import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface DiaryEntry {
  id: string;
  meal_type: string;
  description: string;
  date: string;
}

const mealTypes = [
  { value: 'colazione', label: 'Colazione', icon: 'sunny' as const },
  { value: 'spuntino', label: 'Spuntino', icon: 'cafe' as const },
  { value: 'pranzo', label: 'Pranzo', icon: 'restaurant' as const },
  { value: 'merenda', label: 'Merenda', icon: 'ice-cream' as const },
  { value: 'cena', label: 'Cena', icon: 'moon' as const },
];

export default function Diario() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('colazione');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userEmail } = useAuth();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${BACKEND_URL}/api/diary/${userEmail}?date=${today}`);
      setEntries(response.data);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const addEntry = async () => {
    if (!description.trim()) {
      Alert.alert('Errore', 'Inserisci una descrizione');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await axios.post(`${BACKEND_URL}/api/diary`, {
        user_email: userEmail,
        meal_type: selectedMealType,
        description: description.trim(),
        date: today
      });

      setDescription('');
      setModalVisible(false);
      await loadEntries();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare l\'entry');
      console.error('Error adding entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/diary/${entryId}`);
      await loadEntries();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile eliminare l\'entry');
      console.error('Error deleting entry:', error);
    }
  };

  const getMealIcon = (mealType: string) => {
    const meal = mealTypes.find(m => m.value === mealType);
    return meal ? meal.icon : 'restaurant';
  };

  const getMealLabel = (mealType: string) => {
    const meal = mealTypes.find(m => m.value === mealType);
    return meal ? meal.label : mealType;
  };

  return (
    <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Diario Alimentare</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.dateCard}>
            <Ionicons name="calendar" size={20} color="#8b5cf6" />
            <Text style={styles.dateText}>Oggi - {new Date().toLocaleDateString('it-IT')}</Text>
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nessuna entry oggi</Text>
              <Text style={styles.emptySubtext}>Inizia a tracciare i tuoi pasti!</Text>
            </View>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryTitleRow}>
                    <Ionicons name={getMealIcon(entry.meal_type)} size={20} color="#8b5cf6" />
                    <Text style={styles.entryTitle}>{getMealLabel(entry.meal_type)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteEntry(entry.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.entryDescription}>{entry.description}</Text>
              </View>
            ))
          )}
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
                <Text style={styles.modalTitle}>Aggiungi Pasto</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Tipo di pasto</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealTypeScroll}>
                {mealTypes.map((meal) => (
                  <TouchableOpacity
                    key={meal.value}
                    style={[
                      styles.mealTypeButton,
                      selectedMealType === meal.value && styles.mealTypeButtonActive
                    ]}
                    onPress={() => setSelectedMealType(meal.value)}
                  >
                    <Ionicons
                      name={meal.icon}
                      size={20}
                      color={selectedMealType === meal.value ? '#fff' : '#8b5cf6'}
                    />
                    <Text style={[
                      styles.mealTypeText,
                      selectedMealType === meal.value && styles.mealTypeTextActive
                    ]}>
                      {meal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Descrizione</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Es: Pasta al pomodoro con verdure"
                placeholderTextColor="#94a3b8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={addEntry}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
  addButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 32,
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
  entryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  entryDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
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
    minHeight: 400,
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
    marginBottom: 12,
  },
  mealTypeScroll: {
    marginBottom: 24,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    gap: 6,
  },
  mealTypeButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  mealTypeTextActive: {
    color: '#fff',
  },
  textArea: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});