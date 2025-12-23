import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00897B', '#004D40']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termini di Servizio</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Ultimo aggiornamento: Dicembre 2025</Text>

        <Text style={styles.sectionTitle}>1. Accettazione dei Termini</Text>
        <Text style={styles.paragraph}>
          Utilizzando NutriKids AI, accetti questi Termini di Servizio. Se non accetti, non utilizzare l'app.
        </Text>

        <Text style={styles.sectionTitle}>2. Descrizione del Servizio</Text>
        <Text style={styles.paragraph}>
          NutriKids AI è un'app di nutrizione pediatrica che fornisce:{'\n'}
          • Analisi AI dei pasti{'\n'}
          • Consigli nutrizionali personalizzati{'\n'}
          • Tracciamento diario alimentare{'\n'}
          • Gamification per bambini{'\n'}
          • Piani alimentari intelligenti
        </Text>

        <Text style={styles.sectionTitle}>3. Account Utente</Text>
        <Text style={styles.paragraph}>
          • Devi fornire informazioni accurate durante la registrazione{'\n'}
          • Sei responsabile della sicurezza del tuo account{'\n'}
          • Non condividere le tue credenziali{'\n'}
          • Avvisaci immediatamente di accessi non autorizzati
        </Text>

        <Text style={styles.sectionTitle}>4. Piano Gratuito vs Premium</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Piano Gratuito:</Text>{'\n'}
          • 3 scansioni giornaliere{'\n'}
          • 5 messaggi Coach Maya al giorno{'\n'}
          • Funzionalità base{'\n\n'}
          
          <Text style={styles.bold}>Piano Premium:</Text>{'\n'}
          • Scansioni illimitate{'\n'}
          • Chat illimitata con Coach Maya{'\n'}
          • Piani alimentari avanzati{'\n'}
          • Supporto prioritario
        </Text>

        <Text style={styles.sectionTitle}>5. Pagamenti e Abbonamenti</Text>
        <Text style={styles.paragraph}>
          • Gli abbonamenti Premium si rinnovano automaticamente{'\n'}
          • Puoi cancellare in qualsiasi momento dalle impostazioni{'\n'}
          • Nessun rimborso per periodi parziali{'\n'}
          • I prezzi possono variare (ti avviseremo)
        </Text>

        <Text style={styles.sectionTitle}>6. Uso Appropriato</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>È vietato:</Text>{'\n'}
          • Utilizzare l'app per scopi illegali{'\n'}
          • Violare diritti di proprietà intellettuale{'\n'}
          • Tentare di hackerare o danneggiare il servizio{'\n'}
          • Creare account falsi{'\n'}
          • Abusare del sistema di referral
        </Text>

        <Text style={styles.sectionTitle}>7. Disclaimer Medico</Text>
        <Text style={styles.paragraph}>
          ⚠️ <Text style={styles.bold}>IMPORTANTE:</Text>{'\n'}
          NutriKids AI fornisce informazioni nutrizionali generali e NON sostituisce il consiglio medico professionale.
          Per condizioni mediche specifiche, allergie gravi o problemi di salute, consulta sempre un pediatra o nutrizionista certificato.
        </Text>

        <Text style={styles.sectionTitle}>8. Proprietà Intellettuale</Text>
        <Text style={styles.paragraph}>
          Tutti i contenuti, design, loghi e software di NutriKids AI sono protetti da copyright e appartengono a noi.
        </Text>

        <Text style={styles.sectionTitle}>9. Limitazione di Responsabilità</Text>
        <Text style={styles.paragraph}>
          NutriKids AI è fornito "così com'è". Non garantiamo:{'\n'}
          • Accuratezza al 100% delle analisi AI{'\n'}
          • Disponibilità continua del servizio{'\n'}
          • Risultati specifici per la salute
        </Text>

        <Text style={styles.sectionTitle}>10. Modifiche ai Termini</Text>
        <Text style={styles.paragraph}>
          Possiamo modificare questi termini in qualsiasi momento. Ti avviseremo via email di modifiche significative.
          L'uso continuato dopo le modifiche costituisce accettazione.
        </Text>

        <Text style={styles.sectionTitle}>11. Cancellazione Account</Text>
        <Text style={styles.paragraph}>
          Puoi cancellare il tuo account in qualsiasi momento dalle Impostazioni. Tutti i tuoi dati saranno eliminati permanentemente.
        </Text>

        <Text style={styles.sectionTitle}>12. Contatti</Text>
        <Text style={styles.paragraph}>
          Per domande sui termini, contattaci a:{'\n'}
          📧 support@nutrikids.ai{'\n'}
          🌐 www.nutrikids.ai
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
  bold: {
    fontWeight: 'bold',
    color: '#00897B',
  },
});
