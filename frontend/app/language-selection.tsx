import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../locales/translations';

const greetings = {
  it: ['Ciao', 'Benvenuto', 'Buongiorno'],
  en: ['Hello', 'Welcome', 'Good Morning'],
  es: ['Hola', 'Bienvenido', 'Buenos Días']
};

const languageNames = {
  it: 'Italiano',
  en: 'English',
  es: 'Español'
};

export default function LanguageSelection() {
  const [currentGreeting, setCurrentGreeting] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('it');
  const router = useRouter();

  useEffect(() => {
    // Cycle through greetings
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentGreeting((prev) => (prev + 1) % 3);
    }, 2000);

    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => clearInterval(interval);
  }, []);

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem('appLanguage', selectedLanguage);
      await AsyncStorage.setItem('hasSelectedLanguage', 'true');
      router.replace('/');
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const allGreetings = Object.keys(greetings).map((lang) => 
    greetings[lang as Language][currentGreeting]
  );

  return (
    <LinearGradient colors={['#10b981', '#059669', '#047857']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Animated Greetings - compatti in alto */}
          <View style={styles.greetingsContainer}>
            <Animated.View style={[styles.greetingBox, { opacity: fadeAnim }]}>
              <Text style={styles.greetingTextLarge}>
                {allGreetings[0]}
              </Text>
            </Animated.View>
          </View>

          {/* Language Selection Title */}
          <View style={styles.titleContainer}>
            <Ionicons name="globe-outline" size={28} color="#fff" />
            <Text style={styles.title}>
              {selectedLanguage === 'it' && 'Seleziona la tua lingua'}
              {selectedLanguage === 'en' && 'Select your language'}
              {selectedLanguage === 'es' && 'Selecciona tu idioma'}
            </Text>
          </View>

          {/* Language Options - centrate */}
          <View style={styles.languagesContainer}>
            {(['it', 'en', 'es'] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageButton,
                  selectedLanguage === lang && styles.languageButtonActive
                ]}
                onPress={() => setSelectedLanguage(lang)}
              >
                <View style={styles.languageContent}>
                  <View style={styles.languageFlag}>
                    <Text style={styles.flagText}>
                      {lang === 'it' && '🇮🇹'}
                      {lang === 'en' && '🇬🇧'}
                      {lang === 'es' && '🇪🇸'}
                    </Text>
                  </View>
                  <Text style={[
                    styles.languageName,
                    selectedLanguage === lang && styles.languageNameActive
                  ]}>
                    {languageNames[lang]}
                  </Text>
                  {selectedLanguage === lang && (
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              {selectedLanguage === 'it' && 'Continua'}
              {selectedLanguage === 'en' && 'Continue'}
              {selectedLanguage === 'es' && 'Continuar'}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  greetingsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  greetingBox: {
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    marginVertical: 4,
    fontWeight: '500',
  },
  greetingTextLarge: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
    marginVertical: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 12,
  },
  languagesContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  languageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  languageButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  languageFlag: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 28,
  },
  languageName: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  languageNameActive: {
    color: '#1e293b',
  },
  continueButton: {
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
  continueButtonText: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
