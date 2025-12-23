import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Aiuto() {
  const router = useRouter();

  const handleEmail = () => {
    Linking.openURL('mailto:supporto@nutrikids.ai?subject=Richiesta Supporto');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/393333333333?text=Ciao, ho bisogno di aiuto con NutriKids AI');
  };

  return (
    <LinearGradient colors={['#10b981', '#059669']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aiuto & Supporto</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroCard}>
            <Ionicons name="chatbubble-ellipses" size={48} color="#10b981" />
            <Text style={styles.heroTitle}>Come possiamo aiutarti?</Text>
            <Text style={styles.heroSubtitle}>Siamo qui per rispondere alle tue domande</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contattaci</Text>
            
            <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
              <View style={styles.contactIcon}>
                <Ionicons name="mail" size={24} color="#10b981" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Email</Text>
                <Text style={styles.contactSubtitle}>support@nutrikids.ai</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Domande Frequenti</Text>
            
            <View style={styles.faqCard}>
              <Text style={styles.faqQuestion}>Come funziona lo scanner AI?</Text>
              <Text style={styles.faqAnswer}>
                Scatta una foto del piatto e l'AI analizzerà gli alimenti riconoscendo i valori nutrizionali e fornendo suggerimenti personalizzati.
              </Text>
            </View>

            <View style={styles.faqCard}>
              <Text style={styles.faqQuestion}>Come posso aggiungere un bambino?</Text>
              <Text style={styles.faqAnswer}>
                Vai su Profilo e clicca il pulsante "+" accanto a "I Miei Bambini" per aggiungere nome ed età del tuo bambino.
              </Text>
            </View>

            <View style={styles.faqCard}>
              <Text style={styles.faqQuestion}>Coach Maya è gratuito?</Text>
              <Text style={styles.faqAnswer}>
                Sì! Coach Maya è gratuito e sempre disponibile per rispondere alle tue domande sulla nutrizione infantile.
              </Text>
            </View>

            <View style={styles.faqCard}>
              <Text style={styles.faqQuestion}>Come funziona Premium?</Text>
              <Text style={styles.faqAnswer}>
                Con Premium ottieni grafici avanzati, scanner completo, piani personalizzati e molto altro. Prova gratuita di 7 giorni.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guide</Text>
            
            <TouchableOpacity style={styles.guideCard}>
              <Ionicons name="book" size={20} color="#10b981" />
              <Text style={styles.guideTitle}>Guida Introduttiva</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.guideCard}>
              <Ionicons name="nutrition" size={20} color="#10b981" />
              <Text style={styles.guideTitle}>Consigli Nutrizionali</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.guideCard}>
              <Ionicons name="videocam" size={20} color="#10b981" />
              <Text style={styles.guideTitle}>Video Tutorial</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
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
  heroCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
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
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  faqCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  guideTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
});