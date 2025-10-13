import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Slide {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    id: 1,
    icon: 'restaurant',
    iconColor: '#fff',
    title: 'Nutrizione Intelligente',
    description: 'Scopri l\'alimentazione perfetta per i tuoi bambini con l\'aiuto dell\'AI'
  },
  {
    id: 2,
    icon: 'search',
    iconColor: '#fff',
    title: 'Scanner Alimentare',
    description: 'Scansiona etichette e scopri istantamente i valori nutrizionali'
  },
  {
    id: 3,
    icon: 'medical',
    iconColor: '#fff',
    title: 'Coach Maya',
    description: 'Il tuo assistente personale per consigli nutrizionali esperti'
  },
  {
    id: 4,
    icon: 'leaf',
    iconColor: '#fff',
    title: 'Crescita Sana',
    description: 'Monitora la crescita e lo sviluppo dei tuoi bambini'
  }
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      // Se ha visto l'onboarding E ha fatto login, vai alla home
      if (hasSeenOnboarding === 'true' && userEmail) {
        setTimeout(() => {
          router.replace('/home');
        }, 100);
      } 
      // Se ha visto l'onboarding ma non ha fatto login, vai al login
      else if (hasSeenOnboarding === 'true' && !userEmail) {
        setTimeout(() => {
          router.replace('/login');
        }, 100);
      }
      // Altrimenti mostra l'onboarding
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const currentSlide = slides[currentIndex];

  return (
    <LinearGradient colors={['#10b981', '#059669', '#047857']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Salta</Text>
        </TouchableOpacity>

        <View style={styles.slideContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name={currentSlide.icon} size={100} color={currentSlide.iconColor} />
          </View>
          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentIndex === index && styles.paginationDotActive
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? 'Inizia' : 'Avanti'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#10b981" />
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
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  nextButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'bold',
  },
});