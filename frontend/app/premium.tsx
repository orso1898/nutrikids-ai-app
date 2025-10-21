import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Premium() {
  const router = useRouter();
  const { t } = useLanguage();
  const [monthlyPrice, setMonthlyPrice] = useState<number>(5.99);
  const [yearlyPrice, setYearlyPrice] = useState<number>(49.99);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      // Carica i prezzi dall'endpoint pubblico
      const response = await axios.get(`${BACKEND_URL}/api/pricing`);
      setMonthlyPrice(response.data.monthly_price || 5.99);
      setYearlyPrice(response.data.yearly_price || 49.99);
    } catch (error) {
      // Se fallisce, usa i prezzi di default
      console.log('Using default prices');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: 'bar-chart' as const, titleKey: 'premium.features.advancedCharts', descKey: 'premium.features.advancedChartsDesc' },
    { icon: 'scan' as const, titleKey: 'premium.features.completeScanner', descKey: 'premium.features.completeScannerDesc' },
    { icon: 'calendar' as const, titleKey: 'premium.features.personalizedPlans', descKey: 'premium.features.personalizedPlansDesc' },
    { icon: 'chatbubble-ellipses' as const, titleKey: 'premium.features.unlimitedChat', descKey: 'premium.features.unlimitedChatDesc' },
    { icon: 'restaurant' as const, titleKey: 'premium.features.exclusiveRecipes', descKey: 'premium.features.exclusiveRecipesDesc' },
    { icon: 'notifications' as const, titleKey: 'premium.features.smartReminders', descKey: 'premium.features.smartRemindersDesc' },
    { icon: 'people' as const, titleKey: 'premium.features.multipleProfiles', descKey: 'premium.features.multipleProfilesDesc' },
    { icon: 'cloud-download' as const, titleKey: 'premium.features.dataExport', descKey: 'premium.features.dataExportDesc' },
  ];

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
            <Text style={styles.heroTitle}>{t('premium.heroTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('premium.heroSubtitle')}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Caricamento prezzi...</Text>
            </View>
          ) : (
            <>
              <View style={styles.pricingCard}>
                <View style={styles.pricingHeader}>
                  <Text style={styles.pricingLabel}>{t('premium.monthlyPlan')}</Text>
                  <View style={styles.pricingBadge}>
                    <Text style={styles.badgeText}>{t('premium.popular')}</Text>
                  </View>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingPrice}>€{monthlyPrice.toFixed(2)}</Text>
                  <Text style={styles.pricingPeriod}>{t('premium.perMonth')}</Text>
                </View>
                <Text style={styles.pricingSubtext}>{t('premium.cancelAnytime')}</Text>
              </View>

              <View style={styles.pricingCard}>
                <View style={styles.pricingHeader}>
                  <Text style={styles.pricingLabel}>{t('premium.yearlyPlan')}</Text>
                  <View style={[styles.pricingBadge, styles.savingBadge]}>
                    <Text style={styles.badgeText}>{t('premium.savePercent')}</Text>
                  </View>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingPrice}>€{yearlyPrice.toFixed(2)}</Text>
                  <Text style={styles.pricingPeriod}>{t('premium.perYear')}</Text>
                </View>
                <Text style={styles.pricingSubtext}>{t('premium.billedYearly')}</Text>
                <Text style={styles.savingsText}>
                  💰 Risparmio annuale: €{((monthlyPrice * 12) - yearlyPrice).toFixed(2)}
                </Text>
              </View>
            </>
          )}

          <Text style={styles.featuresTitle}>{t('premium.featuresTitle')}</Text>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon} size={24} color="#eab308" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{t(feature.titleKey)}</Text>
                  <Text style={styles.featureDescription}>{t(feature.descKey)}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>{t('premium.startFreeTrial')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.disclaimer}>{t('premium.disclaimer')}</Text>
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
  scrollContent: { paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
  heroTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: '#64748b', textAlign: 'center' },
  pricingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pricingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pricingLabel: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  pricingBadge: { backgroundColor: '#eab308', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  savingBadge: { backgroundColor: '#10b981' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  pricingRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  pricingPrice: { fontSize: 32, fontWeight: 'bold', color: '#1e293b' },
  pricingPeriod: { fontSize: 16, color: '#64748b', marginLeft: 4 },
  pricingSubtext: { fontSize: 14, color: '#64748b' },
  featuresTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginHorizontal: 16, marginTop: 8, marginBottom: 16 },
  featuresGrid: { paddingHorizontal: 16 },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  featureDescription: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  ctaButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: { fontSize: 18, fontWeight: 'bold', color: '#eab308' },
  disclaimer: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', marginTop: 16, marginHorizontal: 32, lineHeight: 18 },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  savingsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
  },
});
