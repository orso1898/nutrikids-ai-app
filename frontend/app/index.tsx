import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
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
  imageUrl: string;
}

const slides: Slide[] = [
  {
    id: 1,
    icon: 'restaurant',
    iconColor: '#fff',
    title: 'Nutrizione Intelligente',
    description: 'Scopri l\'alimentazione perfetta per i tuoi bambini con l\'aiuto dell\'AI',
    imageUrl: 'https://images.unsplash.com/photo-1576089073624-b5751a8f4de9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBlYXRpbmclMjBoZWFsdGh5fGVufDB8fHx8MTc2MDQzMDAwMXww&ixlib=rb-4.1.0&q=85'
  },
  {
    id: 2,
    icon: 'search',
    iconColor: '#fff',
    title: 'Scanner Alimentare',
    description: 'Scansiona etichette e scopri istantamente i valori nutrizionali',
    imageUrl: 'https://images.unsplash.com/photo-1596776572010-93e181f9fc07?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMHZlZ2V0YWJsZXMlMjBoZWFsdGh5fGVufDB8fHx8MTc2MDQzMDAwN3ww&ixlib=rb-4.1.0&q=85'
  },
  {
    id: 3,
    icon: 'medical',
    iconColor: '#fff',
    title: 'Coach Maya',
    description: 'Il tuo assistente personale per consigli nutrizionali esperti',
    imageUrl: 'https://images.pexels.com/photos/8844379/pexels-photo-8844379.jpeg'
  },
  {
    id: 4,
    icon: 'leaf',
    iconColor: '#fff',
    title: 'Crescita Sana',
    description: 'Monitora la crescita e lo sviluppo dei tuoi bambini',
    imageUrl: 'https://images.unsplash.com/photo-1758743871361-bd24138a0cb7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGNoaWxkJTIwZWF0aW5nfGVufDB8fHx8MTc2MDQzMDAxOHww&ixlib=rb-4.1.0&q=85'
  }
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      console.log('🔍 Checking onboarding:', { hasSeenOnboarding, userEmail });
      
      // Se ha visto l'onboarding E ha fatto login, vai alla home
      if (hasSeenOnboarding === 'true' && userEmail) {
        console.log('✅ Has login data - Going to home');
        router.replace('/home');
        return;
      } 
      // Se ha visto l'onboarding ma non ha fatto login, vai al login
      else if (hasSeenOnboarding === 'true' && !userEmail) {
        console.log('✅ Has seen onboarding - Going to login');
        router.replace('/login');
        return;
      }
      // Altrimenti mostra l'onboarding
      console.log('✅ First time - Showing onboarding');
      setIsChecking(false);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsChecking(false);
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

  // Non mostrare nulla mentre controlla lo stato
  if (isChecking) {
    return (
      <LinearGradient colors={['#10b981', '#059669', '#047857']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#10b981', '#059669', '#047857']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Salta</Text>
        </TouchableOpacity>

        <View style={styles.slideContainer}>
          {/* Image card with rounded corners */}
          <View style={styles.imageCard}>
            <Image 
              source={{ uri: currentSlide.imageUrl }} 
              style={styles.slideImage}
              resizeMode="cover"
            />
          </View>

          {/* Icon container overlapping image */}
          <View style={styles.iconContainer}>
            <Ionicons name={currentSlide.icon} size={60} color="#fff" />
          </View>

          {/* Content with background */}
          <View style={styles.textContent}>
            <View style={styles.textBackground}>
              <Text style={styles.title}>{currentSlide.title}</Text>
              <Text style={styles.description}>{currentSlide.description}</Text>
            </View>
          </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
  },
  imageWrapper: {
    width: '100%',
    height: 300,
    position: 'relative',
    marginBottom: 40,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContent: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 17,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 32,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'bold',
  },
});