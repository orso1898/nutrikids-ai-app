import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';

export default function WelcomePremium() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showConfetti, setShowConfetti] = useState(true);

  const premiumFeatures = [
    { icon: 'camera', title: t('welcomePremium.feature1Title'), description: t('welcomePremium.feature1Desc') },
    { icon: 'chatbubbles', title: t('welcomePremium.feature2Title'), description: t('welcomePremium.feature2Desc') },
    { icon: 'restaurant', title: t('welcomePremium.feature3Title'), description: t('welcomePremium.feature3Desc') },
    { icon: 'people', title: t('welcomePremium.feature4Title'), description: t('welcomePremium.feature4Desc') },
    { icon: 'analytics', title: t('welcomePremium.feature5Title'), description: t('welcomePremium.feature5Desc') },
    { icon: 'star', title: t('welcomePremium.feature6Title'), description: t('welcomePremium.feature6Desc') },
  ];

  return (
    <LinearGradient
      colors={['#059669', '#10b981', '#34d399']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Confetti/Celebration Icon */}
          <View 
           
            style={styles.celebrationContainer}
          >
            <View style={styles.crownContainer}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
            <View style={styles.confettiRow}>
              <Text style={styles.confettiEmoji}>🎉</Text>
              <Text style={styles.confettiEmoji}>✨</Text>
              <Text style={styles.confettiEmoji}>🎊</Text>
            </View>
          </View>

          {/* Title */}
          <View>
            <Text style={styles.title}>{t('welcomePremium.title')}</Text>
            <Text style={styles.subtitle}>{t('welcomePremium.subtitle')}</Text>
          </View>

          {/* Message */}
          <View 
           
            style={styles.messageContainer}
          >
            <Text style={styles.message}>
              {t('welcomePremium.message')}
            </Text>
          </View>

          {/* Features List */}
          <View 
           
            style={styles.featuresContainer}
          >
            <Text style={styles.featuresTitle}>{t('welcomePremium.nowYouCan')}</Text>
            {premiumFeatures.map((feature, index) => (
              <View 
                key={index}
               
                style={styles.featureItem}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={24} color="#059669" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
            ))}
          </View>

          {/* CTA Button */}
          <View 
           
            style={styles.ctaContainer}
          >
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.replace('/home')}
            >
              <Text style={styles.ctaButtonText}>Inizia a Esplorare</Text>
              <Ionicons name="arrow-forward" size={20} color="#059669" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace('/scanner')}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.secondaryButtonText}>Prova lo Scanner</Text>
            </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
  },
  celebrationContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  crownContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  crownEmoji: {
    fontSize: 50,
  },
  confettiRow: {
    flexDirection: 'row',
    gap: 20,
  },
  confettiEmoji: {
    fontSize: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  messageContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  ctaContainer: {
    width: '100%',
    gap: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
