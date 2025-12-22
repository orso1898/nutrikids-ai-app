import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const screenWidth = Dimensions.get('window').width;

interface DashboardStats {
  total_meals_7days: number;
  total_scans_7days: number;
  coach_messages_7days: number;
  avg_health_score: number;
  daily_meals: { [key: string]: number };
  meal_types: { [key: string]: number };
  children_count: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { userEmail } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/dashboard/stats/${userEmail}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#06b6d4', '#0891b2']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Caricamento statistiche...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const mealTypesArray = stats ? Object.entries(stats.meal_types) : [];
  const maxMealType = mealTypesArray.length > 0 ? Math.max(...mealTypesArray.map(([_, count]) => count)) : 1;

  return (
    <LinearGradient colors={['#06b6d4', '#0891b2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity onPress={loadStats} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Period Badge */}
          <View style={styles.periodBadge}>
            <Ionicons name="calendar" size={16} color="#0891b2" />
            <Text style={styles.periodText}>Ultimi 7 giorni</Text>
          </View>

          {/* Quick Stats Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="restaurant" size={28} color="#10b981" />
              </View>
              <Text style={styles.statNumber}>{stats?.total_meals_7days || 0}</Text>
              <Text style={styles.statLabel}>{t('dashboard.mealsLogged')}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="camera" size={28} color="#f59e0b" />
              </View>
              <Text style={styles.statNumber}>{stats?.total_scans_7days || 0}</Text>
              <Text style={styles.statLabel}>{t('dashboard.aiScans')}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="chatbubbles" size={28} color="#3b82f6" />
              </View>
              <Text style={styles.statNumber}>{stats?.coach_messages_7days || 0}</Text>
              <Text style={styles.statLabel}>{t('dashboard.coachChats')}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="heart" size={28} color="#ec4899" />
              </View>
              <Text style={styles.statNumber}>{stats?.avg_health_score || 0}</Text>
              <Text style={styles.statLabel}>{t('dashboard.avgScore')}</Text>
            </View>
          </View>

          {/* Health Score Card */}
          {stats && stats.avg_health_score > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="fitness" size={20} color="#10b981" />
                <Text style={styles.cardTitle}>Salute Nutrizionale</Text>
              </View>
              <View style={styles.healthScoreContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${(stats.avg_health_score / 10) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.healthScoreText}>
                  {stats.avg_health_score >= 7 ? '🎉 Ottimo!' : stats.avg_health_score >= 5 ? '👍 Buono' : '💪 Continua così'}
                </Text>
              </View>
            </View>
          )}

          {/* Meal Types Distribution */}
          {mealTypesArray.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="pie-chart" size={20} color="#f59e0b" />
                <Text style={styles.cardTitle}>Distribuzione Pasti</Text>
              </View>
              <View style={styles.chartContainer}>
                {mealTypesArray.map(([type, count]) => (
                  <View key={type} style={styles.chartRow}>
                    <Text style={styles.chartLabel}>{type}</Text>
                    <View style={styles.chartBarContainer}>
                      <View 
                        style={[
                          styles.chartBar, 
                          { width: `${(count / maxMealType) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.chartValue}>{count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Children Info */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="people" size={20} color="#3b82f6" />
              <Text style={styles.cardTitle}>I Tuoi Bambini</Text>
            </View>
            <Text style={styles.childrenText}>
              {stats?.children_count === 0 ? 'Nessun profilo bambino creato' : `${stats?.children_count} ${stats?.children_count === 1 ? 'bambino registrato' : 'bambini registrati'}`}
            </Text>
            {stats?.children_count === 0 && (
              <TouchableOpacity 
                style={styles.addChildButton}
                onPress={() => router.push('/profilo')}
              >
                <Ionicons name="add-circle" size={20} color="#3b82f6" />
                <Text style={styles.addChildButtonText}>Aggiungi Bambino</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Empty State */}
          {stats && stats.total_meals_7days === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name="analytics-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>Inizia a Tracciare!</Text>
              <Text style={styles.emptyText}>
                Registra i pasti nel Diario o usa lo Scanner per vedere le statistiche qui.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  refreshButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0891b2',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  healthScoreContainer: {
    gap: 12,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  healthScoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
  },
  chartContainer: {
    gap: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chartLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 80,
  },
  chartBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  chartValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    width: 30,
    textAlign: 'right',
  },
  childrenText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 12,
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addChildButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
