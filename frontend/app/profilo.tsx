import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Child {
  id: string;
  name: string;
  age: number;
  allergies?: string[];
  points?: number;
  level?: number;
  badges?: string[];
  avatar?: string;
}

export default function Profilo() {
  const [children, setChildren] = useState<Child[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [selectedTestChild, setSelectedTestChild] = useState<Child | null>(null);
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{childName: string, newLevel: number, newBadges: string[]}>({childName: '', newLevel: 0, newBadges: []});
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Animation values for each child
  const [childAnimations, setChildAnimations] = useState<{[key: string]: {
    progressAnim: Animated.Value,
    pointsAnim: Animated.Value,
    scaleAnim: Animated.Value
  }}>({});
  
  const router = useRouter();
  const { userEmail, isAdmin, logout } = useAuth();
  const { t } = useLanguage();

  // Helper function to get avatar icon based on level
  const getAvatarIcon = (level: number = 1, avatar: string = 'default') => {
    const avatars: {[key: string]: string} = {
      'default': '👶',
      'hero': '🦸',
      'star': '⭐',
      'champion': '🏆',
      'legend': '👑'
    };
    
    // Auto-unlock based on level
    if (level >= 20) return avatars['legend'];
    if (level >= 10) return avatars['champion'];
    if (level >= 5) return avatars['star'];
    if (level >= 1) return avatars['hero'];
    
    return avatars[avatar] || avatars['default'];
  };

  // Helper function to get badge emoji
  const getBadgeIcon = (badgeName: string) => {
    const badgeIcons: {[key: string]: string} = {
      'first_century': '🌟',
      'level_5': '🚀',
      'level_10': '👑',
    };
    return badgeIcons[badgeName] || '🏅';
  };

  useEffect(() => {
    loadChildren();
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user/${userEmail}`);
      if (response.data) {
        setIsPremium(response.data.subscription_tier === 'premium' || response.data.is_premium === true);
      }
    } catch (error) {
      console.log('Error loading premium status:', error);
    }
  };

  const loadChildren = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/children/${userEmail}`);
      const loadedChildren = response.data;
      
      // Initialize animations for each child
      const newAnimations: {[key: string]: any} = {};
      loadedChildren.forEach((child: Child) => {
        if (!childAnimations[child.id]) {
          newAnimations[child.id] = {
            progressAnim: new Animated.Value(0),
            pointsAnim: new Animated.Value(child.points || 0),
            scaleAnim: new Animated.Value(1)
          };
        }
      });
      
      setChildAnimations(prev => ({...prev, ...newAnimations}));
      setChildren(loadedChildren);
      
      // Animate progress bars
      loadedChildren.forEach((child: Child) => {
        const progressPercent = ((child.points || 0) % 100);
        if (childAnimations[child.id] || newAnimations[child.id]) {
          const anim = childAnimations[child.id] || newAnimations[child.id];
          Animated.timing(anim.progressAnim, {
            toValue: progressPercent,
            duration: 1000,
            useNativeDriver: false
          }).start();
        }
      });
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const addChild = async () => {
    if (!childName.trim()) {
      Alert.alert('Errore', 'Inserisci il nome del bambino');
      return;
    }

    const age = parseInt(childAge);
    if (isNaN(age) || age < 0 || age > 18) {
      Alert.alert('Errore', 'Inserisci un\'età valida (0-18)');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/children`, {
        parent_email: userEmail,
        name: childName.trim(),
        age: age
      });

      setChildName('');
      setChildAge('');
      setModalVisible(false);
      await loadChildren();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiungere il bambino');
      console.error('Error adding child:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test Functions - Add points manually for demo
  const testAddPoints = async (points: number) => {
    if (!selectedTestChild) return;
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/children/${selectedTestChild.id}/award-points`, { points });
      
      setTestModalVisible(false);
      
      // Check if level up happened
      if (response.data.level_up) {
        setLevelUpData({
          childName: selectedTestChild.name,
          newLevel: response.data.level,
          newBadges: response.data.new_badges || []
        });
        setLevelUpModalVisible(true);
      } else {
        Alert.alert('✅ Successo', `${points} punti aggiunti a ${selectedTestChild.name}!`);
      }
      
      await loadChildren();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiungere punti');
      console.error('Error adding test points:', error);
    }
  };

  const deleteChild = async (childId: string, childName: string) => {
    Alert.alert(
      'Conferma',
      `Sei sicuro di voler eliminare ${childName}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/children/${childId}`);
              await loadChildren();
            } catch (error) {
              Alert.alert('Errore', 'Impossibile eliminare il bambino');
              console.error('Error deleting child:', error);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout...');
      
      await logout();
      
      // Verifica che sia stato cancellato
      const check1 = await AsyncStorage.getItem('userEmail');
      const check2 = await AsyncStorage.getItem('hasSeenOnboarding');
      
      const message = `Logout Completato!\n\nDati cancellati:\n• Email: ${check1 || 'Cancellata ✅'}\n• Onboarding: ${check2 || 'Cancellato ✅'}\n\nChiudi e riapri l'app.`;
      
      // Try window.alert first, fallback to console
      try {
        window.alert(message);
      } catch (e) {
        console.log(message);
        Alert.alert('Logout Completato', 'Dati cancellati correttamente');
      }
      
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      try {
        window.alert('Errore durante il logout');
      } catch (e) {
        Alert.alert('Errore', 'Errore durante il logout');
      }
    }
  };

  const handleReset = async () => {
    try {
      console.log('🔄 Starting app reset...');
      
      // Conferma prima di resettare
      let confirmed = false;
      
      try {
        confirmed = window.confirm('Sei sicuro di voler resettare l\'app? Perderai tutti i dati e tornerai alla selezione lingua.');
      } catch (e) {
        // Su mobile usa Alert
        await new Promise((resolve) => {
          Alert.alert(
            'Reset App',
            'Sei sicuro di voler resettare l\'app? Perderai tutti i dati.',
            [
              { text: 'Annulla', style: 'cancel', onPress: () => { confirmed = false; resolve(null); } },
              { text: 'Reset', style: 'destructive', onPress: () => { confirmed = true; resolve(null); } }
            ]
          );
        });
      }

      if (!confirmed) {
        console.log('❌ Reset cancelled by user');
        return;
      }

      console.log('💥 Clearing AsyncStorage...');
      
      // Cancella TUTTO da AsyncStorage
      await AsyncStorage.clear();
      
      console.log('✅ AsyncStorage cleared successfully');
      
      // Messaggio di conferma
      try {
        window.alert('App resettata! Riavvio in corso...');
      } catch (e) {
        Alert.alert('Successo', 'App resettata completamente');
      }
      
      // Usa semplicemente router push con delay per dare tempo al clear
      setTimeout(() => {
        router.push('/language-selection');
      }, 500);
      
    } catch (error) {
      console.error('❌ Reset error:', error);
      try {
        window.alert('Errore durante il reset: ' + error);
      } catch (e) {
        Alert.alert('Errore', 'Errore durante il reset');
      }
    }
  };

  return (
    <LinearGradient colors={['#10b981', '#059669']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Ionicons name="person" size={48} color="#10b981" />
            </View>
            <Text style={styles.profileEmail}>{userEmail}</Text>
            {isPremium && (
              <View style={[styles.adminBadge, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="star" size={16} color="#fff" />
                <Text style={styles.adminText}>Premium 👑</Text>
              </View>
            )}
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#fff" />
                <Text style={styles.adminText}>{t('profile.administration')}</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.children')}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={styles.infoButton}>
                <Ionicons name="help-circle" size={26} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addChildButton}>
                <Ionicons name="add-circle" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {children.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>{t('profile.noChildren')}</Text>
              <Text style={styles.emptySubtext}>{t('profile.addChild')}</Text>
            </View>
          ) : (
            children.map((child) => (
              <View key={child.id} style={styles.childCard}>
                <View style={styles.childCardHeader}>
                  <View style={styles.childHeaderLeft}>
                    <View style={styles.childAvatar}>
                      <Text style={styles.childAvatarEmoji}>{getAvatarIcon(child.level, child.avatar)}</Text>
                    </View>
                    <View>
                      <Text style={styles.childName}>{child.name}</Text>
                      <Text style={styles.childAge}>{child.age} {child.age === 1 ? 'anno' : 'anni'}</Text>
                    </View>
                  </View>
                  <View style={styles.childActions}>
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectedTestChild(child);
                        setTestModalVisible(true);
                      }}
                      style={styles.actionButton}
                    >
                      <Ionicons name="flask" size={24} color="#10b981" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => router.push({
                        pathname: '/edit-child',
                        params: {
                          childId: child.id,
                          childName: child.name,
                          childAge: child.age.toString(),
                          childAllergies: JSON.stringify(child.allergies || []),
                          parentEmail: userEmail
                        }
                      })}
                      style={styles.actionButton}
                    >
                      <Ionicons name="create-outline" size={24} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => deleteChild(child.id, child.name)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="trash-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Gamification Stats */}
                <View style={styles.gamificationSection}>
                  <View style={styles.gamificationContainer}>
                    <View style={styles.statBadge}>
                      <Ionicons name="trophy" size={16} color="#fbbf24" />
                      <Text style={styles.statText}>Livello {child.level || 1}</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <Ionicons name="star" size={16} color="#8b5cf6" />
                      <Text style={styles.statText}>{child.points || 0} punti</Text>
                    </View>
                  </View>
                  
                  {/* Animated Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <Animated.View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: childAnimations[child.id]?.progressAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                          }) || '0%'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {100 - ((child.points || 0) % 100)} punti al prossimo livello
                  </Text>
                  
                  {/* Badges Display */}
                  {child.badges && child.badges.length > 0 && (
                    <View style={styles.badgesContainer}>
                      <Text style={styles.badgesTitle}>Badge Guadagnati:</Text>
                      <View style={styles.badgesList}>
                        {child.badges.map((badge, index) => (
                          <View key={index} style={styles.badgeItem}>
                            <Text style={styles.badgeEmoji}>{getBadgeIcon(badge)}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}

          {/* Admin Section - Only visible for admin */}
          {isAdmin && (
            <View style={styles.adminSection}>
              <View style={styles.adminSectionHeader}>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={styles.adminSectionTitle}>Amministrazione</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.adminDashboardButton}
                onPress={() => router.push('/admin-dashboard')}
              >
                <LinearGradient
                  colors={['#7c3aed', '#6d28d9']}
                  style={styles.adminGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="speedometer" size={32} color="#fff" />
                  <Text style={styles.adminDashboardText}>Dashboard Admin</Text>
                  <Text style={styles.adminDashboardSubtext}>Statistiche e gestione</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
              <Ionicons name="refresh-outline" size={24} color="#64748b" />
              <Text style={styles.actionText}>{t('profile.reset')}</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/impostazioni')}>
              <Ionicons name="settings-outline" size={24} color="#64748b" />
              <Text style={styles.actionText}>{t('profile.settings')}</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/aiuto')}>
              <Ionicons name="help-circle-outline" size={24} color="#64748b" />
              <Text style={styles.actionText}>{t('profile.helpSupport')}</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/info')}>
              <Ionicons name="information-circle-outline" size={24} color="#64748b" />
              <Text style={styles.actionText}>{t('profile.appInfo')}</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('profile.addChild')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>{t('profile.childName')}</Text>
              <TextInput
                style={styles.input}
                placeholder="Es: Marco"
                placeholderTextColor="#94a3b8"
                value={childName}
                onChangeText={setChildName}
              />

              <Text style={styles.label}>{t('profile.childAge')}</Text>
              <TextInput
                style={styles.input}
                placeholder="Es: 5"
                placeholderTextColor="#94a3b8"
                value={childAge}
                onChangeText={setChildAge}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={addChild}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Salvataggio...' : 'Salva'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Info Modal - Gamification Explanation */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={infoModalVisible}
          onRequestClose={() => setInfoModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.infoModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🎮 Come Funziona la Gamification</Text>
                <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Punti Section */}
                <View style={styles.infoSection}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="star" size={32} color="#8b5cf6" />
                  </View>
                  <Text style={styles.infoTitle}>⭐ Guadagna Punti</Text>
                  <Text style={styles.infoText}>
                    I tuoi bambini guadagnano punti quando:
                  </Text>
                  <View style={styles.infoList}>
                    <Text style={styles.infoListItem}>• Aggiungi un pasto nel Diario: <Text style={styles.infoBold}>+10 punti</Text></Text>
                    <Text style={styles.infoListItem}>• Scansioni un cibo con lo Scanner: <Text style={styles.infoBold}>+5 punti</Text></Text>
                  </View>
                </View>

                {/* Livelli Section */}
                <View style={styles.infoSection}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="trophy" size={32} color="#fbbf24" />
                  </View>
                  <Text style={styles.infoTitle}>🏆 Sali di Livello</Text>
                  <Text style={styles.infoText}>
                    Ogni <Text style={styles.infoBold}>100 punti</Text> = 1 livello!
                  </Text>
                  <View style={styles.infoList}>
                    <Text style={styles.infoListItem}>• Livello 5: Sblocca avatar speciali</Text>
                    <Text style={styles.infoListItem}>• Livello 10: Ricevi certificati d'onore</Text>
                    <Text style={styles.infoListItem}>• Livello 20: Badge esclusivi!</Text>
                  </View>
                </View>

                {/* Badge Section */}
                <View style={styles.infoSection}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="medal" size={32} color="#ef4444" />
                  </View>
                  <Text style={styles.infoTitle}>🏅 Colleziona Badge</Text>
                  <Text style={styles.infoText}>
                    Raggiungi traguardi speciali per sbloccare badge:
                  </Text>
                  <View style={styles.infoList}>
                    <Text style={styles.infoListItem}>• 🌟 Prima Centuria: 100 punti totali</Text>
                    <Text style={styles.infoListItem}>• 🚀 Livello 5 Raggiunto</Text>
                    <Text style={styles.infoListItem}>• 👑 Livello 10 Raggiunto</Text>
                  </View>
                </View>

                {/* Obiettivo Section */}
                <View style={styles.infoSection}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="rocket" size={32} color="#10b981" />
                  </View>
                  <Text style={styles.infoTitle}>🎯 Obiettivo Finale</Text>
                  <Text style={styles.infoText}>
                    Usa la gamification per:
                  </Text>
                  <View style={styles.infoList}>
                    <Text style={styles.infoListItem}>• Motivare i bambini a mangiare sano</Text>
                    <Text style={styles.infoListItem}>• Rendere la nutrizione divertente</Text>
                    <Text style={styles.infoListItem}>• Monitorare i progressi nel tempo</Text>
                    <Text style={styles.infoListItem}>• Creare abitudini alimentari positive</Text>
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity 
                style={styles.closeInfoButton}
                onPress={() => setInfoModalVisible(false)}
              >
                <Text style={styles.closeInfoButtonText}>Ho Capito! 🎉</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Test Modal - Add Points Manually */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={testModalVisible}
          onRequestClose={() => setTestModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.testModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🧪 Modalità Test</Text>
                <TouchableOpacity onPress={() => setTestModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.testSubtitle}>
                Aggiungi punti a {selectedTestChild?.name} per testare la gamification
              </Text>

              <View style={styles.testButtonsContainer}>
                <TouchableOpacity 
                  style={styles.testButton}
                  onPress={() => testAddPoints(10)}
                >
                  <Text style={styles.testButtonText}>+10 Punti</Text>
                  <Text style={styles.testButtonSubtext}>(Simula Diario)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.testButton}
                  onPress={() => testAddPoints(5)}
                >
                  <Text style={styles.testButtonText}>+5 Punti</Text>
                  <Text style={styles.testButtonSubtext}>(Simula Scanner)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.testButton, styles.testButtonPrimary]}
                  onPress={() => testAddPoints(50)}
                >
                  <Text style={styles.testButtonText}>+50 Punti</Text>
                  <Text style={styles.testButtonSubtext}>(Test Rapido)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.testButton, styles.testButtonSuccess]}
                  onPress={() => testAddPoints(100)}
                >
                  <Text style={styles.testButtonText}>+100 Punti</Text>
                  <Text style={styles.testButtonSubtext}>(Level Up!)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.testInfoBox}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text style={styles.testInfoText}>
                  Usa questi pulsanti per vedere avatar, badge e animazioni senza dover accumulare punti realmente.
                </Text>
              </View>
            </View>
          </View>
        </Modal>

        {/* Level Up Celebration Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={levelUpModalVisible}
          onRequestClose={() => setLevelUpModalVisible(false)}
        >
          <View style={styles.celebrationOverlay}>
            <View style={styles.celebrationContent}>
              {/* Confetti effect with emojis */}
              <View style={styles.confettiContainer}>
                <Text style={styles.confetti}>🎉</Text>
                <Text style={styles.confetti}>🎊</Text>
                <Text style={styles.confetti}>✨</Text>
                <Text style={styles.confetti}>🌟</Text>
                <Text style={styles.confetti}>🎈</Text>
              </View>
              
              <View style={styles.celebrationIcon}>
                <Ionicons name="trophy" size={80} color="#fbbf24" />
              </View>
              
              <Text style={styles.celebrationTitle}>🎉 LIVELLO RAGGIUNTO! 🎉</Text>
              <Text style={styles.celebrationSubtitle}>
                {levelUpData.childName} è salito al
              </Text>
              <Text style={styles.celebrationLevel}>
                LIVELLO {levelUpData.newLevel}!
              </Text>
              
              {levelUpData.newBadges.length > 0 && (
                <View style={styles.newBadgesContainer}>
                  <Text style={styles.newBadgesTitle}>🏅 Nuovi Badge Sbloccati!</Text>
                  <View style={styles.newBadgesList}>
                    {levelUpData.newBadges.map((badge, index) => (
                      <View key={index} style={styles.newBadgeItem}>
                        <Text style={styles.newBadgeText}>
                          {badge === 'first_century' ? '🌟 Prima Centuria' : 
                           badge === 'level_5' ? '🚀 Livello 5' : 
                           badge === 'level_10' ? '👑 Livello 10' : badge}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.celebrationButton}
                onPress={() => setLevelUpModalVisible(false)}
              >
                <Text style={styles.celebrationButtonText}>Fantastico! 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  profileCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  adminText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addChildButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  childCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  childCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  childHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  childAvatarEmoji: {
    fontSize: 32,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  childAge: {
    fontSize: 14,
    color: '#64748b',
  },
  gamificationSection: {
    width: '100%',
  },
  gamificationContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  childActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  actionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  adminSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  adminSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  adminDashboardButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  adminGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  adminDashboardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  adminDashboardSubtext: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 4,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    padding: 4,
  },
  infoModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  infoSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoIconContainer: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 12,
  },
  infoBold: {
    fontWeight: 'bold',
    color: '#10b981',
  },
  infoList: {
    marginTop: 8,
  },
  infoListItem: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 24,
    paddingLeft: 8,
  },
  closeInfoButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeInfoButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  badgesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  badgesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  badgesList: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badgeItem: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  badgeEmoji: {
    fontSize: 20,
  },
  testModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '75%',
  },
  testSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  testButtonsContainer: {
    gap: 12,
  },
  testButton: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  testButtonPrimary: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  testButtonSuccess: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  testButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  testButtonSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  testInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
    alignItems: 'flex-start',
  },
  testInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    alignItems: 'center',
    position: 'relative',
  },
  confettiContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 10,
  },
  confetti: {
    fontSize: 32,
  },
  celebrationIcon: {
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  celebrationLevel: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginTop: 8,
    marginBottom: 16,
  },
  newBadgesContainer: {
    marginTop: 16,
    width: '100%',
  },
  newBadgesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 12,
  },
  newBadgesList: {
    gap: 8,
  },
  newBadgeItem: {
    backgroundColor: '#fef3c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  newBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    textAlign: 'center',
  },
  celebrationButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
  },
  celebrationButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});