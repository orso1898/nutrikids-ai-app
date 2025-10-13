import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Impostazioni() {
  const [notifiche, setNotifiche] = useState(true);
  const [notifichePasti, setNotifichePasti] = useState(true);
  const [modalitaScura, setModalitaScura] = useState(false);
  const router = useRouter();

  return (
    <LinearGradient colors={['#10b981', '#059669']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Impostazioni</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifiche</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="notifications" size={20} color="#10b981" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Notifiche Push</Text>
                    <Text style={styles.settingSubtitle}>Ricevi notifiche dall'app</Text>
                  </View>
                </View>
                <Switch
                  value={notifiche}
                  onValueChange={setNotifiche}
                  trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                  thumbColor={notifiche ? '#10b981' : '#f1f5f9'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="restaurant" size={20} color="#10b981" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Promemoria Pasti</Text>
                    <Text style={styles.settingSubtitle}>Ricorda gli orari dei pasti</Text>
                  </View>
                </View>
                <Switch
                  value={notifichePasti}
                  onValueChange={setNotifichePasti}
                  trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                  thumbColor={notifichePasti ? '#10b981' : '#f1f5f9'}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aspetto</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="moon" size={20} color="#10b981" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Modalità Scura</Text>
                    <Text style={styles.settingSubtitle}>In arrivo prossimamente</Text>
                  </View>
                </View>
                <Switch
                  value={modalitaScura}
                  onValueChange={setModalitaScura}
                  disabled
                  trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                  thumbColor={'#cbd5e1'}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <View style={styles.settingCard}>
              <TouchableOpacity style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="person" size={20} color="#10b981" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Modifica Profilo</Text>
                    <Text style={styles.settingSubtitle}>Nome, email, foto</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="lock-closed" size={20} color="#10b981" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Privacy</Text>
                    <Text style={styles.settingSubtitle}>Gestisci i tuoi dati</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            
            <View style={styles.settingCard}>
              <TouchableOpacity style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="language" size={20} color="#10b981" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Lingua</Text>
                    <Text style={styles.settingSubtitle}>Italiano</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="download" size={20} color="#10b981" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Scarica Dati</Text>
                    <Text style={styles.settingSubtitle}>Esporta i tuoi dati</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
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
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
});