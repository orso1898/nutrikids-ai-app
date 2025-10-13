import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface MealPlan {
  day: string;
  meals: {
    colazione: string;
    spuntino1: string;
    pranzo: string;
    spuntino2: string;
    cena: string;
  };
}

const weeklyPlan: MealPlan[] = [
  {
    day: 'Lunedì',
    meals: {
      colazione: 'Latte e cereali integrali con frutta fresca',
      spuntino1: 'Yogurt greco con miele',
      pranzo: 'Pasta al pomodoro con verdure e parmigiano',
      spuntino2: 'Frutta di stagione',
      cena: 'Pollo alla griglia con insalata mista'
    }
  },
  {
    day: 'Martedì',
    meals: {
      colazione: 'Pane integrale con marmellata e succo',
      spuntino1: 'Frutta secca (mandorle)',
      pranzo: 'Riso con legumi e verdure cotte',
      spuntino2: 'Crackers integrali',
      cena: 'Pesce al forno con patate'
    }
  },
  {
    day: 'Mercoledì',
    meals: {
      colazione: 'Yogurt con granola e frutti di bosco',
      spuntino1: 'Banana',
      pranzo: 'Pasta al pesto con fagiolini',
      spuntino2: 'Smoothie alla frutta',
      cena: 'Frittata con verdure e insalata'
    }
  },
  {
    day: 'Giovedì',
    meals: {
      colazione: 'Pancakes integrali con miele',
      spuntino1: 'Yogurt con cereali',
      pranzo: 'Minestrone con crostini',
      spuntino2: 'Mela o pera',
      cena: 'Tacchino con verdure al vapore'
    }
  },
  {
    day: 'Venerdì',
    meals: {
      colazione: 'Latte con biscotti integrali',
      spuntino1: 'Frutta fresca',
      pranzo: 'Pizza margherita con insalata',
      spuntino2: 'Yogurt',
      cena: 'Pesce con riso e broccoli'
    }
  },
  {
    day: 'Sabato',
    meals: {
      colazione: 'Torta di mele fatta in casa con latte',
      spuntino1: 'Frutta secca',
      pranzo: 'Lasagne vegetariane',
      spuntino2: 'Gelato alla frutta',
      cena: 'Hamburger di carne magra con verdure'
    }
  },
  {
    day: 'Domenica',
    meals: {
      colazione: 'Pancakes con sciroppo d\'acero e frutta',
      spuntino1: 'Smoothie bowl',
      pranzo: 'Arrosto con patate e verdure',
      spuntino2: 'Macedonia di frutta',
      cena: 'Zuppa di verdure con crostini'
    }
  }
];

export default function Piani() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Piani Nutrizionali</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#f59e0b" />
            <Text style={styles.infoText}>
              Piano settimanale bilanciato per bambini dai 3 ai 10 anni. Consultare sempre il pediatra.
            </Text>
          </View>

          {weeklyPlan.map((plan, index) => (
            <View key={index} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Ionicons name="calendar" size={20} color="#f59e0b" />
                <Text style={styles.dayTitle}>{plan.day}</Text>
              </View>

              <View style={styles.mealsList}>
                <MealItem icon="sunny" meal="Colazione" description={plan.meals.colazione} />
                <MealItem icon="cafe" meal="Spuntino" description={plan.meals.spuntino1} />
                <MealItem icon="restaurant" meal="Pranzo" description={plan.meals.pranzo} />
                <MealItem icon="ice-cream" meal="Merenda" description={plan.meals.spuntino2} />
                <MealItem icon="moon" meal="Cena" description={plan.meals.cena} />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

interface MealItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  meal: string;
  description: string;
}

const MealItem = ({ icon, meal, description }: MealItemProps) => (
  <View style={styles.mealItem}>
    <Ionicons name={icon} size={18} color="#64748b" />
    <View style={styles.mealContent}>
      <Text style={styles.mealName}>{meal}</Text>
      <Text style={styles.mealDescription}>{description}</Text>
    </View>
  </View>
);

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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  mealsList: {
    gap: 12,
  },
  mealItem: {
    flexDirection: 'row',
    gap: 12,
  },
  mealContent: {
    flex: 1,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  mealDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
});