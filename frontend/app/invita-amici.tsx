import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface ReferralStats {
  referral_code: string;
  invites_count: number;
  successful_invites: number;
  pending_invites: number;
  next_reward_at: number;
  total_rewards: number;
  can_claim_reward: boolean;
  share_link: string;
}

export default function InvitaAmiciScreen() {
  const router = useRouter();
  const { userEmail } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (userEmail) {
      fetchReferralStats();
    }
  }, [userEmail]);

  const fetchReferralStats = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/referral/code/${encodeURIComponent(userEmail!)}`
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (stats) {
      await Clipboard.setString(stats.referral_code);
      Alert.alert('✅', t.referral.codeCopied);
    }
  };

  const shareReferral = async () => {
    if (stats) {
      const message = t.referral.shareMessage.replace('{code}', stats.referral_code);
      try {
        await Share.share({
          message: message + `\n\n${stats.share_link}`,
          title: 'NutriKids AI',
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const claimReward = async () => {
    if (!stats?.can_claim_reward) return;

    setClaiming(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/referral/claim-reward/${encodeURIComponent(userEmail!)}`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          '🎉 ' + t.success,
          data.message || 'Premio rivendicato con successo!'
        );
        fetchReferralStats(); // Refresh stats
      } else {
        const error = await response.json();
        Alert.alert(t.error, error.detail || 'Errore nella rivendicazione del premio');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      Alert.alert(t.error, 'Errore di connessione');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#00897B', '#004D40']} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('referral.title')}</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00897B" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00897B', '#004D40']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('referral.title')}</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🎁</Text>
          <Text style={styles.heroTitle}>{t.referral.subtitle}</Text>
        </View>

        {/* Referral Code */}
        <View style={styles.codeSection}>
          <Text style={styles.sectionLabel}>{t.referral.yourCode}</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.code}>{stats?.referral_code}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyCode}>
              <Ionicons name="copy-outline" size={20} color="#00897B" />
              <Text style={styles.copyText}>{t.referral.copyCode}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton} onPress={shareReferral}>
          <LinearGradient
            colors={['#00897B', '#004D40']}
            style={styles.shareGradient}
          >
            <Ionicons name="share-social" size={24} color="#fff" />
            <Text style={styles.shareText}>{t.referral.shareLink}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>{t.referral.howItWorks}</Text>
          <View style={styles.step}>
            <Text style={styles.stepText}>{t.referral.step1}</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepText}>{t.referral.step2}</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepText}>{t.referral.step3}</Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{t.referral.stats}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.invites_count || 0}</Text>
              <Text style={styles.statLabel}>{t.referral.totalInvites}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.successful_invites || 0}</Text>
              <Text style={styles.statLabel}>{t.referral.successfulInvites}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.total_rewards || 0}</Text>
              <Text style={styles.statLabel}>{t.referral.rewardsEarned}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.next_reward_at || 3}</Text>
              <Text style={styles.statLabel}>{t.referral.nextReward}</Text>
            </View>
          </View>
        </View>

        {/* Claim Reward Button */}
        {stats?.can_claim_reward && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={claimReward}
            disabled={claiming}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.claimGradient}
            >
              {claiming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="gift" size={24} color="#fff" />
                  <Text style={styles.claimText}>{t.referral.claimReward}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  heroEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  codeSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 12,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00897B',
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#00897B',
    fontWeight: '600',
  },
  shareButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  shareText: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  howItWorksSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  step: {
    marginBottom: 12,
    paddingLeft: 10,
  },
  stepText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  statsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00897B',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  claimButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  claimGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  claimText: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
