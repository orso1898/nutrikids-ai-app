import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../contexts/OfflineContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isForceOffline, queueLength, syncData, syncPending } = useOffline();

  // Non mostrare banner se online
  if (isOnline && !isForceOffline) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.leftContent}>
        <Ionicons name="cloud-offline-outline" size={20} color="#ffffff" />
        <View style={styles.textContainer}>
          <Text style={styles.bannerText}>
            {isForceOffline ? '📡 Modalità Offline Forzata' : '📡 Modalità Offline'}
          </Text>
          {queueLength > 0 && (
            <Text style={styles.queueText}>
              {queueLength} operazione{queueLength > 1 ? 'i' : ''} in attesa
            </Text>
          )}
        </View>
      </View>

      {queueLength > 0 && isOnline && (
        <TouchableOpacity 
          style={styles.syncButton} 
          onPress={syncData}
          disabled={syncPending}
        >
          <Ionicons 
            name={syncPending ? "sync" : "cloud-upload-outline"} 
            size={18} 
            color="#ffffff" 
          />
          <Text style={styles.syncButtonText}>
            {syncPending ? 'Sync...' : 'Sync'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#E67E22',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 8,
    flex: 1,
  },
  bannerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  queueText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
