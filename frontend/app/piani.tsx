import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface MealPlanDay {
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

interface WeeklyPlan {
  user_email: string;
  week_start_date: string;
  num_people: number;
  monday: MealPlanDay;
  tuesday: MealPlanDay;
  wednesday: MealPlanDay;
  thursday: MealPlanDay;
  friday: MealPlanDay;
  saturday: MealPlanDay;
  sunday: MealPlanDay;
  shopping_list?: string;
}

export default function Piani() {
  const router = useRouter();
  const { t } = useLanguage();
  const { userEmail } = useAuth();
  
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [numPeople, setNumPeople] = useState(2);
  const [currentWeekStart, setCurrentWeekStart] = useState('');
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily'); // Modalità: giornaliero o settimanale
  const [selectedDay, setSelectedDay] = useState('monday'); // Giorno selezionato per modalità giornaliera

  useEffect(() => {
    // Calculate current week start (Monday)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    const weekStart = monday.toISOString().split('T')[0];
    setCurrentWeekStart(weekStart);
    
    loadPlan(weekStart);
  }, []);

  const loadPlan = async (weekStart: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/meal-plan/${userEmail}/${weekStart}`);
      setPlan(response.data);
      setNumPeople(response.data.num_people || 2);
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMeal = (day: string, mealType: string, value: string) => {
    if (!plan) return;
    
    setPlan({
      ...plan,
      [day]: {
        ...plan[day as keyof WeeklyPlan],
        [mealType]: value,
      },
    });
  };

  const savePlan = async () => {
    if (!plan) return;
    
    try {
      await axios.post(`${BACKEND_URL}/api/meal-plan`, {
        ...plan,
        num_people: numPeople,
      });
      
      try {
        window.alert('Piano salvato con successo! ✅');
      } catch (e) {
        Alert.alert('Successo', 'Piano salvato!');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      try {
        window.alert('Errore nel salvataggio');
      } catch (e) {
        Alert.alert('Errore', 'Impossibile salvare il piano');
      }
    }
  };

  const generateShoppingList = async () => {
    if (!plan) return;
    
    setGenerating(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/meal-plan/generate-shopping-list`, null, {
        params: {
          user_email: userEmail,
          week_start_date: currentWeekStart,
          num_people: numPeople,
        },
      });
      
      setPlan({
        ...plan,
        shopping_list: response.data.shopping_list,
      });
      
      try {
        window.alert('Lista della spesa generata! 🛒');
      } catch (e) {
        Alert.alert('Successo', 'Lista della spesa generata!');
      }
    } catch (error: any) {
      console.error('Error generating list:', error);
      const errorMsg = error.response?.data?.detail || 'Errore nella generazione';
      try {
        window.alert(errorMsg);
      } catch (e) {
        Alert.alert('Errore', errorMsg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const renderDayPlan = (dayName: string, dayLabel: string) => {
    if (!plan) return null;
    
    const dayPlan = plan[dayName as keyof WeeklyPlan] as MealPlanDay;
    
    return (
      <View key={dayName} style={styles.dayCard}>
        <Text style={styles.dayTitle}>{dayLabel}</Text>
        
        <View style={styles.mealInput}>
          <Ionicons name="sunny" size={16} color="#f59e0b" />
          <TextInput
            style={styles.input}
            value={dayPlan?.breakfast || ''}
            onChangeText={(value) => updateMeal(dayName, 'breakfast', value)}
            placeholder="Colazione"
            placeholderTextColor="rgba(0,0,0,0.4)"
          />
        </View>
        
        <View style={styles.mealInput}>
          <Ionicons name="restaurant" size={16} color="#10b981" />
          <TextInput
            style={styles.input}
            value={dayPlan?.lunch || ''}
            onChangeText={(value) => updateMeal(dayName, 'lunch', value)}
            placeholder="Pranzo"
            placeholderTextColor="rgba(0,0,0,0.4)"
          />
        </View>
        
        <View style={styles.mealInput}>
          <Ionicons name="moon" size={16} color="#6366f1" />
          <TextInput
            style={styles.input}
            value={dayPlan?.dinner || ''}
            onChangeText={(value) => updateMeal(dayName, 'dinner', value)}
            placeholder="Cena"
            placeholderTextColor="rgba(0,0,0,0.4)"
          />
        </View>
        
        <View style={styles.mealInput}>
          <Ionicons name="ice-cream" size={16} color="#ec4899" />
          <TextInput
            style={styles.input}
            value={dayPlan?.snack || ''}
            onChangeText={(value) => updateMeal(dayName, 'snack', value)}
            placeholder="Snack"
            placeholderTextColor="rgba(0,0,0,0.4)"
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Caricamento...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Piano Settimanale</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Number of People */}
          <View style={styles.peopleCard}>
            <Ionicons name="people" size={24} color="#f59e0b" />
            <Text style={styles.peopleLabel}>Numero di Persone:</Text>
            <View style={styles.peopleControls}>
              <TouchableOpacity 
                onPress={() => setNumPeople(Math.max(1, numPeople - 1))}
                style={styles.peopleButton}
              >
                <Ionicons name="remove" size={20} color="#f59e0b" />
              </TouchableOpacity>
              <Text style={styles.peopleNumber}>{numPeople}</Text>
              <TouchableOpacity 
                onPress={() => setNumPeople(numPeople + 1)}
                style={styles.peopleButton}
              >
                <Ionicons name="add" size={20} color="#f59e0b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Days */}
          {renderDayPlan('monday', 'Lunedì')}
          {renderDayPlan('tuesday', 'Martedì')}
          {renderDayPlan('wednesday', 'Mercoledì')}
          {renderDayPlan('thursday', 'Giovedì')}
          {renderDayPlan('friday', 'Venerdì')}
          {renderDayPlan('saturday', 'Sabato')}
          {renderDayPlan('sunday', 'Domenica')}

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={savePlan}>
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Salva Piano</Text>
          </TouchableOpacity>

          {/* Generate Shopping List */}
          <TouchableOpacity 
            style={[styles.generateButton, generating && styles.generateButtonDisabled]} 
            onPress={generateShoppingList}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cart" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>Genera Lista della Spesa con AI 🤖</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Shopping List */}
          {plan?.shopping_list && (
            <View style={styles.shoppingListCard}>
              <View style={styles.shoppingListHeader}>
                <Ionicons name="cart" size={24} color="#10b981" />
                <Text style={styles.shoppingListTitle}>Lista della Spesa</Text>
              </View>
              <Text style={styles.shoppingListText}>{plan.shopping_list}</Text>
            </View>
          )}

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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 12 },
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  peopleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  peopleLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  peopleControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  peopleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  peopleNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    minWidth: 30,
    textAlign: 'center',
  },
  dayCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  mealInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 12,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  shoppingListCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  shoppingListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  shoppingListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  shoppingListText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
});
