import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: 'bar-chart',
    title: 'Grafici Avanzati',
    description: 'Visualizza statistiche dettagliate e grafici interattivi'
  },
  {
    icon: 'scan',
    title: 'Scanner Completo',
    description: 'Analisi completa dei valori nutrizionali da etichette'
  },
  {
    icon: 'calendar',
    title: 'Piani Personalizzati',
    description: 'Piani nutrizionali creati su misura per il tuo bambino'
  },
  {
    icon: 'chatbubble-ellipses',
    title: 'Chat Illimitata',
    description: 'Conversazioni illimitate con Coach Maya'
  },
  {
    icon: 'restaurant',
    title: 'Ricette Esclusive',
    description: 'Accesso a centinaia di ricette sane e gustose'
  },
  {
    icon: 'notifications',
    title: 'Promemoria Smart',
    description: 'Notifiche intelligenti per pasti e idratazione'
  },
  {
    icon: 'people',
    title: 'Profili Multipli',
    description: 'Gestisci più bambini con profili separati'
  },
  {
    icon: 'cloud-download',
    title: 'Export Dati',
    description: 'Esporta report per il pediatra'
  },
];

export default function Premium() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#eab308', '#ca8a04']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroCard}>
            <View style={styles.crownContainer}>
              <Ionicons name="diamond" size={48} color="#eab308" />
            </View>
            <Text style={styles.heroTitle}>NutriKids Premium</Text>
            <Text style={styles.heroSubtitle}>
              Sblocca tutte le funzionalità per la crescita sana del tuo bambino
            </Text>
          </View>

          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <Text style={styles.pricingLabel}>Piano Mensile</Text>
              <View style={styles.pricingBadge}>
                <Text style={styles.badgeText}>Popolare</Text>
              </View>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingPrice}>€9.99</Text>
              <Text style={styles.pricingPeriod}>/mese</Text>
            </View>
            <Text style={styles.pricingSubtext}>Cancella in qualsiasi momento</Text>
          </View>

          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <Text style={styles.pricingLabel}>Piano Annuale</Text>
              <View style={[styles.pricingBadge, styles.savingBadge]}>
                <Text style={styles.badgeText}>Risparmia 40%</Text>
              </View>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingPrice}>€5.99</Text>
              <Text style={styles.pricingPeriod}>/mese</Text>
            </View>
            <Text style={styles.pricingSubtext}>Fatturato €71.88 all'anno</Text>
          </View>

          <Text style={styles.featuresTitle}>Tutto quello che ottieni:</Text>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon} size={24} color="#eab308" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Inizia Prova Gratuita</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            7 giorni di prova gratuita, poi €9.99/mese. Cancella in qualsiasi momento.
          </Text>
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
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  pricingCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pricingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  pricingBadge: {
    backgroundColor: '#eab308',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingBadge: {
    backgroundColor: '#10b981',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  pricingPeriod: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
  },
  pricingSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#eab308',
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
});