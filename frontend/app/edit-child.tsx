import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://foodcoach-android.preview.emergentagent.com';

const COMMON_ALLERGIES = [
  'Lattosio',
  'Glutine',
  'Uova',
  'Frutta secca',
  'Arachidi',
  'Pesce',
  'Crostacei',
  'Soia',
  'Sedano',
  'Senape',
  'Sesamo',
];

export default function EditChild() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const childId = params.childId as string;
  const childName = params.childName as string;
  const childAge = params.childAge as string;
  const childAllergies = params.childAllergies as string;

  useEffect(() => {
    // Load existing data
    setName(childName || '');
    setAge(childAge || '');
    
    if (childAllergies) {
      try {
        const allergies = JSON.parse(childAllergies);
        setSelectedAllergies(allergies);
      } catch (e) {
        setSelectedAllergies([]);
      }
    }
    
    setLoading(false);
  }, []);

  const toggleAllergy = (allergy: string) => {
    if (selectedAllergies.includes(allergy)) {
      setSelectedAllergies(selectedAllergies.filter(a => a !== allergy));
    } else {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies([...selectedAllergies, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setSelectedAllergies(selectedAllergies.filter(a => a !== allergy));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      try {
        window.alert('Inserisci il nome del bambino');
      } catch (e) {
        Alert.alert('Errore', 'Inserisci il nome del bambino');
      }
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 18) {
      try {
        window.alert('Inserisci un\'età valida (0-18)');
      } catch (e) {
        Alert.alert('Errore', 'Inserisci un\'età valida');
      }
      return;
    }

    setSaving(true);
    try {
      const parentEmail = params.parentEmail as string;
      
      await axios.put(`${BACKEND_URL}/api/children/${childId}`, {
        parent_email: parentEmail,
        name: name.trim(),
        age: ageNum,
        allergies: selectedAllergies,
      });

      try {
        window.alert('Profilo aggiornato con successo! ✅');
      } catch (e) {
        Alert.alert('Successo', 'Profilo aggiornato!');
      }

      router.back();
    } catch (error) {
      console.error('Error updating child:', error);
      try {
        window.alert('Errore durante l\'aggiornamento');
      } catch (e) {
        Alert.alert('Errore', 'Impossibile aggiornare il profilo');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#10b981', '#059669']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#10b981', '#059669']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifica Profilo</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nome del bambino"
              placeholderTextColor="rgba(0,0,0,0.4)"
            />

            <Text style={styles.label}>Età</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Età"
              keyboardType="number-pad"
              placeholderTextColor="rgba(0,0,0,0.4)"
            />
          </View>

          {/* Allergies Section */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={24} color="#ef4444" />
              <Text style={styles.sectionTitle}>Allergie e Intolleranze</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Seleziona tutte le allergie del bambino. L'app ti avviserà quando rileva questi allergeni.
            </Text>

            <View style={styles.allergiesGrid}>
              {COMMON_ALLERGIES.map((allergy) => (
                <TouchableOpacity
                  key={allergy}
                  style={[
                    styles.allergyChip,
                    selectedAllergies.includes(allergy) && styles.allergyChipSelected,
                  ]}
                  onPress={() => toggleAllergy(allergy)}
                >
                  <Text
                    style={[
                      styles.allergyChipText,
                      selectedAllergies.includes(allergy) && styles.allergyChipTextSelected,
                    ]}
                  >
                    {allergy}
                  </Text>
                  {selectedAllergies.includes(allergy) && (
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Allergy */}
            <Text style={styles.customLabel}>Altra allergia:</Text>
            <View style={styles.customAllergyContainer}>
              <TextInput
                style={styles.customInput}
                value={customAllergy}
                onChangeText={setCustomAllergy}
                placeholder="Es. Kiwi, Fragole..."
                placeholderTextColor="rgba(0,0,0,0.4)"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addCustomAllergy}
              >
                <Ionicons name="add" size={24} color="#10b981" />
              </TouchableOpacity>
            </View>

            {/* Selected Allergies */}
            {selectedAllergies.length > 0 && (
              <View style={styles.selectedContainer}>
                <Text style={styles.selectedTitle}>Allergie selezionate:</Text>
                <View style={styles.selectedList}>
                  {selectedAllergies.map((allergy) => (
                    <View key={allergy} style={styles.selectedChip}>
                      <Text style={styles.selectedChipText}>{allergy}</Text>
                      <TouchableOpacity onPress={() => removeAllergy(allergy)}>
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Salva Modifiche</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  allergiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  allergyChipSelected: {
    backgroundColor: '#ef4444',
  },
  allergyChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  allergyChipTextSelected: {
    color: '#fff',
  },
  customLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  customAllergyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 8,
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  selectedChipText: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
});
