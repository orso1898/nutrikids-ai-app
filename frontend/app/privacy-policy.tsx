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
        <Text style={styles.lastUpdated}>Ultimo aggiornamento: Dicembre 2025</Text>

        <Text style={styles.sectionTitle}>1. Introduzione</Text>
        <Text style={styles.paragraph}>
          Benvenuto su NutriKids AI ("l'App"), un'applicazione dedicata ai genitori per monitorare l'alimentazione dei propri figli.
          La tua privacy e quella dei tuoi bambini è la nostra priorità assoluta. Questa Privacy Policy spiega in modo chiaro 
          e trasparente come raccogliamo, utilizziamo e proteggiamo le informazioni personali.
        </Text>

        <Text style={styles.sectionTitle}>2. Titolare del Trattamento</Text>
        <Text style={styles.paragraph}>
          Il titolare del trattamento dei dati è il proprietario dell'App NutriKids AI.{'\n'}
          Per qualsiasi domanda puoi contattarci a: privacy@nutrikids.ai
        </Text>

        <Text style={styles.sectionTitle}>3. Dati che Raccogliamo</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Dati del Genitore:</Text>{'\n'}
          • Email e password (la password è criptata e non leggibile){'\n'}
          • Preferenze di lingua e notifiche{'\n'}
          • Dati di pagamento (gestiti in modo sicuro da Stripe){'\n\n'}
          
          <Text style={styles.bold}>Dati dei Bambini (inseriti dal genitore):</Text>{'\n'}
          • Nome o soprannome{'\n'}
          • Età{'\n'}
          • Eventuali allergie alimentari{'\n'}
          • Pasti registrati e foto degli alimenti{'\n'}
          • Punteggi e progressi nella gamification
        </Text>

        <Text style={styles.sectionTitle}>4. Protezione dei Dati dei Minori</Text>
        <Text style={styles.paragraph}>
          ⚠️ <Text style={styles.bold}>IMPORTANTE:</Text> NutriKids AI è un'app per GENITORI, non per bambini.{'\n\n'}
          • I dati dei bambini sono inseriti e gestiti esclusivamente dai genitori{'\n'}
          • Non raccogliamo dati direttamente dai minori{'\n'}
          • I bambini non hanno accesso diretto all'app{'\n'}
          • Raccomandiamo di usare soprannomi invece dei nomi reali{'\n'}
          • I dati dei bambini NON vengono MAI condivisi con terze parti per scopi di marketing{'\n'}
          • Puoi eliminare tutti i dati dei tuoi bambini in qualsiasi momento dalla sezione Profilo
        </Text>

        <Text style={styles.sectionTitle}>5. Come Utilizziamo i Dati</Text>
        <Text style={styles.paragraph}>
          Utilizziamo i tuoi dati esclusivamente per:{'\n'}
          • Fornire analisi nutrizionali tramite AI{'\n'}
          • Salvare il diario alimentare della famiglia{'\n'}
          • Personalizzare i piani settimanali e la lista della spesa{'\n'}
          • Gestire la gamification per motivare i bambini{'\n'}
          • Inviarti promemoria sui pasti (se attivati){'\n'}
          • Gestire il tuo abbonamento Premium{'\n\n'}
          <Text style={styles.bold}>NON utilizziamo i dati per:</Text>{'\n'}
          • Pubblicità mirata{'\n'}
          • Profilazione commerciale{'\n'}
          • Vendita a terze parti
        </Text>

        <Text style={styles.sectionTitle}>6. Sicurezza dei Dati</Text>
        <Text style={styles.paragraph}>
          Proteggiamo i tuoi dati con:{'\n'}
          • 🔐 Password criptate con algoritmo bcrypt{'\n'}
          • 🔒 Connessioni HTTPS crittografate{'\n'}
          • 🗄️ Database MongoDB con accesso protetto{'\n'}
          • 💳 Pagamenti gestiti da Stripe (certificato PCI-DSS){'\n'}
          • 🔑 Token di autenticazione sicuri{'\n'}
          • 📱 Dati locali protetti sul dispositivo
        </Text>

        <Text style={styles.sectionTitle}>7. Condivisione con Terze Parti</Text>
        <Text style={styles.paragraph}>
          Condividiamo dati SOLO con:{'\n\n'}
          <Text style={styles.bold}>• OpenAI/Google AI</Text> - Per analizzare le foto dei pasti. 
          Le immagini vengono elaborate e non vengono conservate dai provider AI.{'\n\n'}
          <Text style={styles.bold}>• Stripe</Text> - Per elaborare i pagamenti Premium. 
          Stripe non ha accesso ai dati dei bambini.{'\n\n'}
          <Text style={styles.bold}>• Brevo</Text> - Per inviare email di recupero password.{'\n\n'}
          NON vendiamo MAI i tuoi dati a nessuno.
        </Text>

        <Text style={styles.sectionTitle}>8. I Tuoi Diritti (GDPR)</Text>
        <Text style={styles.paragraph}>
          In conformità al Regolamento Europeo GDPR, hai diritto a:{'\n\n'}
          ✅ <Text style={styles.bold}>Accesso</Text> - Vedere quali dati abbiamo su di te{'\n'}
          ✅ <Text style={styles.bold}>Rettifica</Text> - Correggere dati errati{'\n'}
          ✅ <Text style={styles.bold}>Cancellazione</Text> - Eliminare il tuo account e tutti i dati{'\n'}
          ✅ <Text style={styles.bold}>Portabilità</Text> - Esportare i tuoi dati{'\n'}
          ✅ <Text style={styles.bold}>Opposizione</Text> - Opporti a determinati trattamenti{'\n'}
          ✅ <Text style={styles.bold}>Revoca</Text> - Ritirare il consenso in qualsiasi momento{'\n\n'}
          Per esercitare questi diritti, contattaci a privacy@nutrikids.ai o usa la funzione "Reset App" nel Profilo.
        </Text>

        <Text style={styles.sectionTitle}>9. Conservazione dei Dati</Text>
        <Text style={styles.paragraph}>
          • I dati dell'account vengono conservati finché l'account è attivo{'\n'}
          • Dopo la cancellazione, i dati vengono eliminati entro 30 giorni{'\n'}
          • I dati di pagamento sono gestiti e conservati da Stripe secondo le loro policy{'\n'}
          • I log di sistema sono conservati per massimo 90 giorni
        </Text>

        <Text style={styles.sectionTitle}>10. Cookie e Tecnologie Simili</Text>
        <Text style={styles.paragraph}>
          L'App utilizza solo cookie tecnici essenziali per:{'\n'}
          • Mantenere la sessione di login{'\n'}
          • Salvare le preferenze di lingua{'\n\n'}
          NON utilizziamo cookie di tracciamento pubblicitario.
        </Text>

        <Text style={styles.sectionTitle}>11. Modifiche alla Policy</Text>
        <Text style={styles.paragraph}>
          Possiamo aggiornare questa Privacy Policy. In caso di modifiche sostanziali:{'\n'}
          • Ti avviseremo tramite notifica nell'app{'\n'}
          • Aggiorneremo la data "Ultimo aggiornamento"{'\n'}
          • Per modifiche importanti, potremmo richiedere un nuovo consenso
        </Text>

        <Text style={styles.sectionTitle}>12. Contatti</Text>
        <Text style={styles.paragraph}>
          Per domande, richieste o reclami sulla privacy:{'\n\n'}
          📧 Email: privacy@nutrikids.ai{'\n\n'}
          Risponderemo entro 30 giorni come previsto dal GDPR.
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
