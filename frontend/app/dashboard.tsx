import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#ec4899', '#db2777']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flame" size={28} color="#ec4899" />
              </View>
              <Text style={styles.statValue}>1,250</Text>
              <Text style={styles.statLabel}>Calorie Oggi</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="water" size={28} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>6/8</Text>
              <Text style={styles.statLabel}>Bicchieri d'Acqua</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="nutrition" size={28} color="#10b981" />
              </View>
              <Text style={styles.statValue}>4/5</Text>
              <Text style={styles.statLabel}>Pasti Registrati</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up" size={28} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>+2.5%</Text>
              <Text style={styles.statLabel}>Crescita</Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Ionicons name="bar-chart" size={24} color="#ec4899" />
              <Text style={styles.chartTitle}>Andamento Settimanale</Text>
            </View>
            <View style={styles.chartPlaceholder}>
              <Ionicons name="stats-chart" size={64} color="#cbd5e1" />
              <Text style={styles.placeholderText}>Grafici disponibili nella versione Premium</Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Ionicons name="pie-chart" size={24} color="#ec4899" />
              <Text style={styles.chartTitle}>Distribuzione Macronutrienti</Text>
            </View>
            <View style={styles.chartPlaceholder}>
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <View style={[styles.macroColor, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.macroLabel}>Carboidrati 45%</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroColor, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.macroLabel}>Proteine 30%</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroColor, { backgroundColor: '#3b82f6' }]} />
                  <Text style={styles.macroLabel}>Grassi 25%</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="star" size={24} color="#eab308" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Passa a Premium</Text>
              <Text style={styles.infoText}>Sblocca grafici dettagliati, analisi avanzate e molto altro!</Text>
            </View>
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
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  placeholderText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 16,
    textAlign: 'center',
  },
  macroRow: {
    width: '100%',
    gap: 12,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});