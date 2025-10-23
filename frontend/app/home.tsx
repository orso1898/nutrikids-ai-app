import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

interface CardData {
  id: string;
  titleKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  route: string;
}

const cards: CardData[] = [
  {
    id: '1',
    titleKey: 'home.cards.scanner',
    icon: 'scan',
    gradient: ['#10b981', '#059669'],
    route: '/scanner',
  },
  {
    id: '2',
    titleKey: 'home.cards.coachMaya',
    icon: 'chatbubbles',
    gradient: ['#3b82f6', '#2563eb'],
    route: '/coach-maya',
  },
  {
    id: '3',
    titleKey: 'home.cards.plans',
    icon: 'calendar',
    gradient: ['#f59e0b', '#d97706'],
    route: '/piani',
  },
  {
    id: '4',
    titleKey: 'home.cards.diary',
    icon: 'book',
    gradient: ['#8b5cf6', '#7c3aed'],
    route: '/diario',
  },
  {
    id: '5',
    titleKey: 'home.cards.dashboard',
    icon: 'stats-chart',
    gradient: ['#06b6d4', '#0891b2'],
    route: '/dashboard',
  },
  {
    id: '6',
    titleKey: 'home.cards.premium',
    icon: 'star',
    gradient: ['#ec4899', '#db2777'],
    route: '/premium',
  },
  {
    id: '7',
    titleKey: 'referral.title',
    icon: 'gift',
    gradient: ['#FFD700', '#FFA500'],
    route: '/invita-amici',
  },
];

export default function Home() {
  const router = useRouter();
  const { userEmail, isAdmin } = useAuth();
  const { t } = useLanguage();
  const scale = useSharedValue(1);

  useEffect(() => {
    // Subtle pulse animation for profile button
    scale.value = withRepeat(
      withSequence(
        withSpring(1.05, { damping: 8 }),
        withSpring(1, { damping: 8 })
      ),
      -1,
      false
    );
  }, []);

  const animatedProfileStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleCardPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View 
          entering={FadeInUp.duration(600).springify()}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {userEmail?.split('@')[0] ? 
                `${t('greetings.hello')}!` : 
                t('greetings.hello')
              }
            </Text>
            <Text style={styles.email}>{userEmail}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          <Animated.View style={animatedProfileStyle}>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/profilo')}
            >
              <Ionicons name="person-circle" size={40} color="#10b981" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(200).duration(600).springify()}
          style={styles.titleContainer}
        >
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </Animated.View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {cards.map((card, index) => (
            <Animated.View
              key={card.id}
              entering={FadeInDown.delay(300 + index * 100).duration(600).springify()}
              style={styles.card}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handleCardPress(card.route)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={card.gradient}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={card.icon} size={48} color="#fff" />
                  <Text style={styles.cardTitle}>{t(card.titleKey)}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
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
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#64748b',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  adminText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  profileButton: {
    padding: 4,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  card: {
    width: '47%',
    marginHorizontal: '1.5%',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});
