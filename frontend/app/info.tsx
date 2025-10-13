import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Info() {
  const router = useRouter();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <LinearGradient colors={['#10b981', '#059669']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Info App</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.logoCard}>
            <View style={styles.logoContainer}>
              <Ionicons name="restaurant" size={64} color="#10b981" />
            </View>
            <Text style={styles.appName}>NutriKids AI</Text>
            <Text style={styles.version}>Versione 1.0.0</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Chi Siamo</Text>
            <Text style={styles.infoText}>
              NutriKids AI è un'app innovativa che utilizza l'intelligenza artificiale per aiutare i genitori a gestire la nutrizione dei loro bambini in modo semplice e intelligente.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Funzionalità</Text>
            
            <View style={styles.featureCard}>
              <Ionicons name="scan" size={20} color="#10b981" />
              <Text style={styles.featureText}>Scanner AI con GPT-4o Vision</Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#10b981" />
              <Text style={styles.featureText}>Coach Maya - Assistente nutrizionale</Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="book" size={20} color="#10b981" />
              <Text style={styles.featureText}>Diario alimentare completo</Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="bar-chart" size={20} color="#10b981" />
              <Text style={styles.featureText}>Dashboard con statistiche</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legale</Text>
            
            <TouchableOpacity 
              style={styles.linkCard}
              onPress={() => handleOpenLink('https://nutrikids.ai/privacy')}
            >
              <Ionicons name="shield-checkmark" size={20} color="#10b981" />
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Ionicons name="open-outline" size={16} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkCard}
              onPress={() => handleOpenLink('https://nutrikids.ai/terms')}
            >
              <Ionicons name="document-text" size={20} color="#10b981" />
              <Text style={styles.linkText}>Termini di Servizio</Text>
              <Ionicons name="open-outline" size={16} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkCard}
              onPress={() => handleOpenLink('https://nutrikids.ai/licenses')}
            >
              <Ionicons name="code-slash" size={20} color="#10b981" />
              <Text style={styles.linkText}>Licenze Open Source</Text>
              <Ionicons name="open-outline" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social</Text>
            
            <TouchableOpacity 
              style={styles.socialCard}
              onPress={() => handleOpenLink('https://instagram.com/nutrikids.ai')}
            >
              <Ionicons name="logo-instagram" size={24} color="#e1306c" />
              <Text style={styles.socialText}>@nutrikids.ai</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialCard}
              onPress={() => handleOpenLink('https://facebook.com/nutrikids.ai')}
            >
              <Ionicons name="logo-facebook" size={24} color="#1877f2" />
              <Text style={styles.socialText}>/nutrikids.ai</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialCard}
              onPress={() => handleOpenLink('https://twitter.com/nutrikids_ai')}
            >
              <Ionicons name="logo-twitter" size={24} color="#1da1f2" />
              <Text style={styles.socialText}>@nutrikids_ai</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerCard}>
            <Text style={styles.footerText}>Fatto con ❤️ per i bambini</Text>
            <Text style={styles.copyright}>© 2025 NutriKids AI. Tutti i diritti riservati.</Text>
          </View>
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
  },
  logoCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#64748b',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#1e293b',
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  socialText: {
    fontSize: 15,
    color: '#1e293b',
  },
  footerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});