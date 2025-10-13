import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

interface CardItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  route: string;
  gradient: string[];
}

const cards: CardItem[] = [
  {
    id: '1',
    icon: 'scan',
    title: 'Scanner',
    description: 'Scansiona etichette alimentari',
    route: '/scanner',
    gradient: ['#10b981', '#059669']
  },
  {
    id: '2',
    icon: 'chatbubble-ellipses',
    title: 'Coach Maya',
    description: 'Consigli nutrizionali AI',
    route: '/coach-maya',
    gradient: ['#3b82f6', '#2563eb']
  },
  {
    id: '3',
    icon: 'calendar',
    title: 'Piani',
    description: 'Piani nutrizionali settimanali',
    route: '/piani',
    gradient: ['#f59e0b', '#d97706']
  },
  {
    id: '4',
    icon: 'book',
    title: 'Diario',
    description: 'Traccia i pasti giornalieri',
    route: '/diario',
    gradient: ['#8b5cf6', '#7c3aed']
  },
  {
    id: '5',
    icon: 'bar-chart',
    title: 'Dashboard',
    description: 'Statistiche nutrizionali',
    route: '/dashboard',
    gradient: ['#ec4899', '#db2777']
  },
  {
    id: '6',
    icon: 'star',
    title: 'Premium',
    description: 'Sblocca tutte le funzionalità',
    route: '/premium',
    gradient: ['#eab308', '#ca8a04']
  }
];

export default function Home() {
  const router = useRouter();
  const { userEmail, isAdmin, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  const handleCardPress = (route: string) => {
    router.push(route as any);
  };

  const handleProfilePress = () => {
    router.push('/profilo');
  };

  return (
    <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Ciao!</Text>
            <Text style={styles.email}>{userEmail}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <Ionicons name="person-circle" size={40} color="#10b981" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.sectionTitle}>Le tue funzionalità</Text>
          
          <View style={styles.cardsGrid}>
            {cards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.card}
                onPress={() => handleCardPress(card.route)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={card.gradient}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardIconContainer}>
                    <Ionicons name={card.icon} size={32} color="#fff" />
                  </View>
                </LinearGradient>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDescription}>{card.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  email: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  adminText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  profileButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  cardsGrid: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});