import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00897B', '#004D40']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Ultimo aggiornamento: Gennaio 2025</Text>

        <Text style={styles.sectionTitle}>1. Introduzione</Text>
        <Text style={styles.paragraph}>
          Benvenuto su NutriKids AI. Ci impegniamo a proteggere la tua privacy e i dati dei tuoi bambini.
          Questa Privacy Policy spiega come raccogliamo, utilizziamo e proteggiamo le tue informazioni personali.
        </Text>

        <Text style={styles.sectionTitle}>2. Dati che Raccogliamo</Text>
        <Text style={styles.paragraph}>
          • Email e password (criptata){'\n'}
          • Nome e informazioni dei bambini (età, allergie){'\n'}
          • Foto dei pasti (salvate in modo sicuro){'\n'}
          • Dati nutrizionali e statistiche{'\n'}
          • Token dispositivo per notifiche push
        </Text>

        <Text style={styles.sectionTitle}>3. Come Utilizziamo i Dati</Text>
        <Text style={styles.paragraph}>
          Utilizziamo i tuoi dati esclusivamente per:{'\n'}
          • Fornire analisi nutrizionali AI{'\n'}
          • Salvare il diario alimentare{'\n'}
          • Inviare notifiche personalizzate{'\n'}
          • Migliorare il servizio{'\n'}
          • Gestire il tuo account Premium
        </Text>

        <Text style={styles.sectionTitle}>4. Protezione dei Dati</Text>
        <Text style={styles.paragraph}>
          • Password crittografate con bcrypt{'\n'}
          • Database MongoDB sicuro{'\n'}
          • Connessioni HTTPS crittografate{'\n'}
          • Accesso limitato solo al personale autorizzato{'\n'}
          • Backup regolari per prevenire perdite
        </Text>

        <Text style={styles.sectionTitle}>5. Condivisione Dati</Text>
        <Text style={styles.paragraph}>
          NON vendiamo, affittiamo o condividiamo i tuoi dati personali con terze parti, ad eccezione di:{'\n'}
          • Fornitori di servizi AI (per analisi nutrizionali){'\n'}
          • Processori di pagamento (Stripe) per abbonamenti Premium{'\n'}
          • Autorità legali se richiesto dalla legge
        </Text>

        <Text style={styles.sectionTitle}>6. Diritti dell'Utente (GDPR)</Text>
        <Text style={styles.paragraph}>
          Hai il diritto di:{'\n'}
          • Accedere ai tuoi dati personali{'\n'}
          • Correggere dati errati{'\n'}
          • Cancellare il tuo account e tutti i dati{'\n'}
          • Esportare i tuoi dati{'\n'}
          • Revocare il consenso in qualsiasi momento
        </Text>

        <Text style={styles.sectionTitle}>7. Cookie e Tracking</Text>
        <Text style={styles.paragraph}>
          Utilizziamo solo cookie essenziali per il funzionamento dell'app.
          Non utilizziamo cookie di terze parti per tracciamento pubblicitario.
        </Text>

        <Text style={styles.sectionTitle}>8. Minori</Text>
        <Text style={styles.paragraph}>
          NutriKids AI è destinato ai genitori. Non raccogliamo intenzionalmente dati direttamente da minori di 16 anni senza il consenso dei genitori.
        </Text>

        <Text style={styles.sectionTitle}>9. Modifiche alla Policy</Text>
        <Text style={styles.paragraph}>
          Possiamo aggiornare questa Privacy Policy periodicamente. Ti avviseremo via email di modifiche sostanziali.
        </Text>

        <Text style={styles.sectionTitle}>10. Contatti</Text>
        <Text style={styles.paragraph}>
          Per domande sulla privacy, contattaci a:{'\n'}
          📧 privacy@nutrikids.ai
        </Text>

        <View style={{ height: 50 }} />
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
  content: {
    flex: 1,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00897B',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 15,
  },
});
