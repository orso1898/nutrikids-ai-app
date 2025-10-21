import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Language } from '../locales/translations';
import { useLanguage } from '../contexts/LanguageContext';

const greetings = {
  it: ['Ciao', 'Benvenuto', 'Buongiorno'],
  en: ['Hello', 'Welcome', 'Good Morning'],
  es: ['Hola', 'Bienvenido', 'Buenos Días']
};

const languageOptions = [
  { code: 'it', name: 'Italiano 🇮🇹', flag: '🇮🇹' },
  { code: 'en', name: 'English 🇬🇧', flag: '🇬🇧' },
  { code: 'es', name: 'Español 🇪🇸', flag: '🇪🇸' },
  // Pronte per il futuro
  // { code: 'fr', name: 'Français 🇫🇷', flag: '🇫🇷' },
  // { code: 'de', name: 'Deutsch 🇩🇪', flag: '🇩🇪' },
  // { code: 'pt', name: 'Português 🇵🇹', flag: '🇵🇹' },
];

export default function LanguageSelection() {
  const [currentGreeting, setCurrentGreeting] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('it');
  const router = useRouter();
  const { setLanguage: setContextLanguage } = useLanguage();

  useEffect(() => {
    // Cicla attraverso i saluti
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

    // Fade in iniziale
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => clearInterval(interval);
  }, []);

  const handleContinue = async () => {
    try {
      console.log('🌍 Saving selected language:', selectedLanguage);
      
      // Usa setLanguage del context che aggiorna sia AsyncStorage che lo stato
      await setContextLanguage(selectedLanguage);
      
      // Salva anche il flag che la lingua è stata selezionata
      await AsyncStorage.setItem('hasSelectedLanguage', 'true');
      
      console.log('✅ Language saved and context updated');
      
      // Naviga all'onboarding
      router.replace('/');
    } catch (error) {
      console.error('❌ Error saving language:', error);
    }
  };

  const allGreetings = Object.keys(greetings).map((lang) => 
    greetings[lang as Language][currentGreeting]
  );

  return (
    <LinearGradient colors={['#10b981', '#059669', '#047857']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Animated Greetings - tutti e 3 i saluti */}
          <View style={styles.greetingsContainer}>
            <Animated.View style={[styles.greetingBox, { opacity: fadeAnim }]}>
              <Text style={styles.greetingTextLarge}>
                {greetings.it[currentGreeting]}
              </Text>
              <Text style={styles.greetingTextMedium}>
                {greetings.en[currentGreeting]}
              </Text>
              <Text style={styles.greetingTextMedium}>
                {greetings.es[currentGreeting]}
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

          {/* Modern Dropdown Language Selector */}
          <View style={styles.dropdownContainer}>
            <View style={styles.pickerWrapper}>
              <Ionicons name="language" size={24} color="#10b981" style={styles.pickerIcon} />
              <Picker
                selectedValue={selectedLanguage}
                onValueChange={(itemValue) => setSelectedLanguage(itemValue as Language)}
                style={styles.picker}
                dropdownIconColor="#10b981"
                mode="dropdown"
              >
                {languageOptions.map((lang) => (
                  <Picker.Item 
                    key={lang.code} 
                    label={lang.name} 
                    value={lang.code}
                  />
                ))}
              </Picker>
            </View>
            
            {/* Preview Selected Language */}
            <View style={styles.selectedPreview}>
              <Text style={styles.selectedPreviewText}>
                {languageOptions.find(l => l.code === selectedLanguage)?.flag} {' '}
                {languageOptions.find(l => l.code === selectedLanguage)?.name}
              </Text>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
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
    justifyContent: 'center',
  },
  greetingsContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
    fontSize: 42,
    color: '#fff',
    fontWeight: 'bold',
    marginVertical: 8,
  },
  greetingTextMedium: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginVertical: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 12,
  },
  dropdownContainer: {
    width: '100%',
    marginBottom: 32,
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  pickerIcon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: 56,
    color: '#1e293b',
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedPreviewText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
