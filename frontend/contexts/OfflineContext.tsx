import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { cacheManager } from '../utils/cacheManager';
import axios from 'axios';

interface OfflineContextType {
  isOnline: boolean;
  isForceOffline: boolean;
  setForceOffline: (force: boolean) => void;
  syncPending: boolean;
  lastSyncTime: number | null;
  queueLength: number;
  syncData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isForceOffline, setIsForceOffline] = useState<boolean>(false);
  const [syncPending, setSyncPending] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [queueLength, setQueueLength] = useState<number>(0);

  // Monitor connessione di rete
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable === true;
      setIsOnline(online);

      // Auto-sync quando torna online
      if (online && !isForceOffline) {
        checkAndSync();
      }
    });

    // Check iniziale
    checkInitialConnection();
    loadLastSyncTime();
    updateQueueLength();

    return () => unsubscribe();
  }, []);

  const checkInitialConnection = async () => {
    const state = await NetInfo.fetch();
    const online = state.isConnected === true && state.isInternetReachable === true;
    setIsOnline(online);
  };

  const loadLastSyncTime = async () => {
    const timestamp = await cacheManager.getLastSyncTimestamp();
    setLastSyncTime(timestamp);
  };

  const updateQueueLength = async () => {
    const queue = await cacheManager.getOfflineQueue();
    setQueueLength(queue.length);
  };

  const checkAndSync = async () => {
    const queue = await cacheManager.getOfflineQueue();
    if (queue.length > 0) {
      await syncData();
    }
  };

  const setForceOffline = (force: boolean) => {
    setIsForceOffline(force);
    if (force) {
      Alert.alert(
        '📡 Modalità Offline Forzata',
        'L\'app funzionerà offline anche se connesso a internet. Puoi disabilitare questa opzione in Impostazioni.'
      );
    }
  };

  const syncData = async () => {
    if (syncPending) return; // Evita sync multipli simultanei
    if (!isOnline || isForceOffline) return;

    setSyncPending(true);

    try {
      const queue = await cacheManager.getOfflineQueue();
      console.log(`🔄 Syncing ${queue.length} offline operations...`);

      let successCount = 0;
      let failCount = 0;

      // Process queue con retry logic
      for (const item of queue) {
        try {
          // Max 3 tentativi
          if (item.retries >= 3) {
            console.warn(`⚠️ Item ${item.id} exceeded max retries, skipping`);
            await cacheManager.removeFromOfflineQueue(item.id);
            failCount++;
            continue;
          }

          // Esegui operazione
          const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
          const response = await axios({
            method: item.method,
            url: `${API_URL}${item.endpoint}`,
            data: item.data,
            timeout: 10000,
          });

          if (response.status >= 200 && response.status < 300) {
            // Successo: rimuovi da queue
            await cacheManager.removeFromOfflineQueue(item.id);
            successCount++;
            console.log(`✅ Synced: ${item.method} ${item.endpoint}`);
          } else {
            throw new Error(`HTTP ${response.status}`);
          }

        } catch (error: any) {
          console.error(`❌ Sync failed for ${item.id}:`, error.message);
          
          // Incrementa retry count
          await cacheManager.incrementRetryCount(item.id);
          failCount++;
          
          // Exponential backoff: aspetta prima di continuare
          await new Promise(resolve => setTimeout(resolve, 1000 * item.retries));
        }
      }

      // Aggiorna timestamp sync
      await cacheManager.setLastSyncTimestamp();
      setLastSyncTime(Date.now());
      
      // Aggiorna queue length
      await updateQueueLength();

      // Mostra risultato
      if (successCount > 0) {
        Alert.alert(
          '✅ Dati Sincronizzati',
          `${successCount} operazione${successCount > 1 ? 'i' : ''} sincronizzata${successCount > 1 ? 'e' : ''} con successo!${failCount > 0 ? `\n${failCount} operazione${failCount > 1 ? 'i' : ''} fallita${failCount > 1 ? 'e' : ''}.` : ''}`
        );
      } else if (failCount > 0) {
        Alert.alert(
          '⚠️ Sincronizzazione Parziale',
          `Alcune operazioni non sono state sincronizzate. Riproveremo automaticamente.`
        );
      }

    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert(
        '❌ Errore Sincronizzazione',
        'Impossibile sincronizzare i dati. Riproveremo quando torni online.'
      );
    } finally {
      setSyncPending(false);
    }
  };

  const value: OfflineContextType = {
    isOnline: isOnline && !isForceOffline,
    isForceOffline,
    setForceOffline,
    syncPending,
    lastSyncTime,
    queueLength,
    syncData,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};
