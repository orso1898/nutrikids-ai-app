import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface AnalysisResult {
  foods_detected: string[];
  nutritional_info: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  suggestions: string;
  health_score: number;
}

export default function Scanner() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const router = useRouter();
  const { userEmail } = useAuth();
  const { t } = useLanguage();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const takePicture = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      window.alert('Permesso fotocamera negato. Abilita i permessi nelle impostazioni.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setPhotoBase64(result.assets[0].base64 || null);
        setResult(null);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      window.alert('Errore durante lo scatto della foto');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        window.alert('Permesso galleria negato.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setPhotoBase64(result.assets[0].base64 || null);
        setResult(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      window.alert('Errore durante la selezione dell\'immagine');
    }
  };

  const analyzePhoto = async () => {
    if (!photoBase64) {
      window.alert('Nessuna foto da analizzare');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/analyze-photo`, {
        image_base64: photoBase64,
        user_email: userEmail
      });

      setResult(response.data);
    } catch (error) {
      console.error('Error analyzing photo:', error);
      window.alert('Errore durante l\'analisi. Riprova.');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveToDiario = async () => {
    if (!result || !photoBase64) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      await axios.post(`${BACKEND_URL}/api/diary`, {
        user_email: userEmail,
        meal_type: 'pranzo',
        description: result.foods_detected.join(', '),
        date: today,
        photo_base64: photoBase64,
        nutritional_info: result.nutritional_info
      });

      window.alert('Salvato nel diario! 📝');
    } catch (error) {
      console.error('Error saving to diary:', error);
      window.alert('Errore durante il salvataggio');
    }
  };

  const reset = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setResult(null);
  };

  return (
    <LinearGradient colors={['#10b981', '#059669']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('scanner.title')}</Text>
          {photoUri && (
            <TouchableOpacity onPress={reset} style={styles.resetButton}>
              <Ionicons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {!photoUri ? (
            <View style={styles.emptyState}>
              <Ionicons name="camera" size={80} color="#fff" />
              <Text style={styles.emptyTitle}>{t('scanner.subtitle')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('scanner.description')}
              </Text>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.primaryButton} onPress={takePicture}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.buttonText}>{t('scanner.takePhoto')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
                  <Ionicons name="images" size={24} color="#10b981" />
                  <Text style={styles.secondaryButtonText}>{t('scanner.fromGallery')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.analysisContainer}>
              <View style={styles.photoCard}>
                <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              </View>

              {!result && !analyzing && (
                <TouchableOpacity style={styles.analyzeButton} onPress={analyzePhoto}>
                  <Ionicons name="analytics" size={24} color="#fff" />
                  <Text style={styles.analyzeButtonText}>Analizza con AI</Text>
                </TouchableOpacity>
              )}

              {analyzing && (
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text style={styles.loadingText}>Analisi in corso con GPT-4o Vision...</Text>
                </View>
              )}

              {result && (
                <View style={styles.resultsContainer}>
                  <View style={styles.scoreCard}>
                    <View style={styles.scoreCircle}>
                      <Text style={styles.scoreNumber}>{result.health_score}</Text>
                      <Text style={styles.scoreLabel}>/10</Text>
                    </View>
                    <Text style={styles.scoreTitle}>Punteggio Salute</Text>
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Ionicons name="restaurant" size={20} color="#10b981" />
                      <Text style={styles.cardTitle}>Alimenti Riconosciuti</Text>
                    </View>
                    <View style={styles.foodsList}>
                      {result.foods_detected.map((food, index) => (
                        <View key={index} style={styles.foodItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                          <Text style={styles.foodText}>{food}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Ionicons name="nutrition" size={20} color="#10b981" />
                      <Text style={styles.cardTitle}>Valori Nutrizionali</Text>
                    </View>
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{result.nutritional_info.calories}</Text>
                        <Text style={styles.nutritionLabel}>Calorie</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{result.nutritional_info.proteins}g</Text>
                        <Text style={styles.nutritionLabel}>Proteine</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{result.nutritional_info.carbs}g</Text>
                        <Text style={styles.nutritionLabel}>Carboidrati</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{result.nutritional_info.fats}g</Text>
                        <Text style={styles.nutritionLabel}>Grassi</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{result.nutritional_info.fiber}g</Text>
                        <Text style={styles.nutritionLabel}>Fibre</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Ionicons name="bulb" size={20} color="#10b981" />
                      <Text style={styles.cardTitle}>Suggerimenti di Coach Maya</Text>
                    </View>
                    <Text style={styles.suggestionsText}>{result.suggestions}</Text>
                  </View>

                  <TouchableOpacity style={styles.saveButton} onPress={saveToDiario}>
                    <Ionicons name="bookmark" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Salva nel Diario</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
  resetButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  analysisContainer: {
    gap: 16,
  },
  photoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  photo: {
    width: '100%',
    height: 300,
  },
  analyzeButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  resultsContainer: {
    gap: 16,
  },
  scoreCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  foodsList: {
    gap: 12,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foodText: {
    fontSize: 16,
    color: '#1e293b',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  suggestionsText: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 24,
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
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
