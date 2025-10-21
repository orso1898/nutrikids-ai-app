import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';

interface Slide {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  titleKey: string;
  descriptionKey: string;
  imageUrl: string;
}

const slides: Slide[] = [
  {
    id: 1,
    icon: 'restaurant',
    iconColor: '#fff',
    titleKey: 'onboarding.slide1.title',
    descriptionKey: 'onboarding.slide1.description',
    imageUrl: 'https://images.unsplash.com/photo-1576089073624-b5751a8f4de9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBlYXRpbmclMjBoZWFsdGh5fGVufDB8fHx8MTc2MDQzMDAwMXww&ixlib=rb-4.1.0&q=85'
  },
  {
    id: 2,
    icon: 'search',
    iconColor: '#fff',
    titleKey: 'onboarding.slide2.title',
    descriptionKey: 'onboarding.slide2.description',
    imageUrl: 'https://images.unsplash.com/photo-1596776572010-93e181f9fc07?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMHZlZ2V0YWJsZXMlMjBoZWFsdGh5fGVufDB8fHx8MTc2MDQzMDAwN3ww&ixlib=rb-4.1.0&q=85'
  },
  {
    id: 3,
    icon: 'medical',
    iconColor: '#fff',
    titleKey: 'onboarding.slide3.title',
    descriptionKey: 'onboarding.slide3.description',
    imageUrl: 'https://images.pexels.com/photos/8844379/pexels-photo-8844379.jpeg'
  },
  {
    id: 4,
    icon: 'leaf',
    iconColor: '#fff',
    titleKey: 'onboarding.slide4.title',
    descriptionKey: 'onboarding.slide4.description',
    imageUrl: 'https://images.unsplash.com/photo-1758743871361-bd24138a0cb7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGNoaWxkJTIwZWF0aW5nfGVufDB8fHx8MTc2MDQzMDAxOHww&ixlib=rb-4.1.0&q=85'
  },
  {
    id: 5,
    icon: 'trophy',
    iconColor: '#fbbf24',
    titleKey: 'onboarding.slide5.title',
    descriptionKey: 'onboarding.slide5.description',
    imageUrl: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxraWRzJTIwd2lubmVyJTIwdHJvcGh5fGVufDB8fHx8MTc2MDQzMDAwMXww&ixlib=rb-4.1.0&q=85'
  }
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isChecking, setIsChecking] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSelectedLanguage = await AsyncStorage.getItem('hasSelectedLanguage');
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      console.log('🔍 Checking status:', { hasSelectedLanguage, hasSeenOnboarding, userEmail });
      
      // Se non ha scelto la lingua, vai alla selezione lingua
      if (!hasSelectedLanguage) {
        console.log('✅ No language selected - Going to language selection');
        router.replace('/language-selection');
        return;
      }
      
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

  const animateSlideChange = (newIndex: number) => {
    // Fade out e slide out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Cambia slide
      setCurrentIndex(newIndex);
      
      // Reset position per fade in
      slideAnim.setValue(50);
      
      // Fade in e slide in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      animateSlideChange(currentIndex + 1);
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
          <Text style={styles.skipText}>{t('skip')}</Text>
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.slideContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
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
              <Text style={styles.title}>{t(currentSlide.titleKey)}</Text>
              <Text style={styles.description}>{t(currentSlide.descriptionKey)}</Text>
            </View>
          </View>
        </Animated.View>

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
              {currentIndex === slides.length - 1 ? t('start') : t('next')}
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
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
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  imageCard: {
    width: '100%',
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: -50,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 5,
    marginBottom: 24,
  },
  textContent: {
    width: '100%',
    alignItems: 'center',
  },
  textBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  },
  nextButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
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