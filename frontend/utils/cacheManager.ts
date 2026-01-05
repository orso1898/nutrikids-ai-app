import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Tipi per cache
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in seconds
}

export interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data: any;
  timestamp: number;
  retries: number;
}

// Chiavi cache
const CACHE_KEYS = {
  USER_PROFILE: 'cache_user_profile',
  CHILDREN_PROFILES: 'cache_children_profiles',
  DIARY_ENTRIES: 'cache_diary_entries',
  MEAL_PLANS: 'cache_meal_plans',
  AI_SCANNER_RESULTS: 'cache_scanner_results',
  COACH_MESSAGES: 'cache_coach_messages',
  OFFLINE_QUEUE: 'cache_offline_queue',
  FOOD_DATABASE: 'cache_food_database',
  LAST_SYNC: 'cache_last_sync',
};

// TTL defaults (in secondi)
const DEFAULT_TTL = {
  USER_PROFILE: 7 * 24 * 60 * 60, // 7 giorni
  CHILDREN_PROFILES: 7 * 24 * 60 * 60, // 7 giorni
  DIARY_ENTRIES: 7 * 24 * 60 * 60, // 7 giorni
  MEAL_PLANS: 14 * 24 * 60 * 60, // 14 giorni
  AI_SCANNER_RESULTS: 7 * 24 * 60 * 60, // 7 giorni
  COACH_MESSAGES: 3 * 24 * 60 * 60, // 3 giorni
  FOOD_DATABASE: 30 * 24 * 60 * 60, // 30 giorni
};

class CacheManager {
  private encryptionKey: string | null = null;

  // Inizializza encryption key
  async initialize(userEmail: string) {
    // Genera chiave basata su email (semplificata, in produzione usa più robusto)
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      userEmail + 'nutrikids_salt'
    );
    this.encryptionKey = digest.substring(0, 32);
  }

  // Encrypt data (semplificato - in produzione usa expo-crypto più robusto)
  private async encrypt(data: string): Promise<string> {
    try {
      // Base64 encoding (React Native compatible)
      return btoa(unescape(encodeURIComponent(data)));
    } catch (error) {
      console.error('Encryption error:', error);
      return data;
    }
  }

  // Decrypt data
  private async decrypt(encryptedData: string): Promise<string> {
    try {
      // Base64 decoding (React Native compatible)
      return decodeURIComponent(escape(atob(encryptedData)));
    } catch (error) {
      // Silently return the data if decryption fails (could be unencrypted legacy data)
      return encryptedData;
    }
  }

  // Salva dati in cache
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || DEFAULT_TTL.USER_PROFILE,
      };

      const jsonString = JSON.stringify(cacheItem);
      const encrypted = await this.encrypt(jsonString);
      
      await AsyncStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Recupera dati da cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const encrypted = await AsyncStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = await this.decrypt(encrypted);
      const cacheItem: CacheItem<T> = JSON.parse(decrypted);

      // Verifica TTL
      const age = Date.now() - cacheItem.timestamp;
      if (age > cacheItem.ttl * 1000) {
        // Cache scaduta
        await this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Rimuovi dalla cache
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  // Clear all cache
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Salva profilo utente
  async cacheUserProfile(profile: any): Promise<void> {
    await this.set(CACHE_KEYS.USER_PROFILE, profile, DEFAULT_TTL.USER_PROFILE);
  }

  // Recupera profilo utente
  async getUserProfile(): Promise<any | null> {
    return await this.get(CACHE_KEYS.USER_PROFILE);
  }

  // Salva profili bambini
  async cacheChildrenProfiles(children: any[]): Promise<void> {
    await this.set(CACHE_KEYS.CHILDREN_PROFILES, children, DEFAULT_TTL.CHILDREN_PROFILES);
  }

  // Recupera profili bambini
  async getChildrenProfiles(): Promise<any[] | null> {
    return await this.get(CACHE_KEYS.CHILDREN_PROFILES);
  }

  // Salva diary entries (ultimi 7 giorni)
  async cacheDiaryEntries(entries: any[]): Promise<void> {
    // Filtra solo ultimi 7 giorni
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentEntries = entries.filter(entry => {
      const entryTime = new Date(entry.timestamp).getTime();
      return entryTime > sevenDaysAgo;
    });

    await this.set(CACHE_KEYS.DIARY_ENTRIES, recentEntries, DEFAULT_TTL.DIARY_ENTRIES);
  }

  // Recupera diary entries
  async getDiaryEntries(): Promise<any[] | null> {
    return await this.get(CACHE_KEYS.DIARY_ENTRIES);
  }

  // Salva risultati scanner AI
  async cacheScannerResult(result: any): Promise<void> {
    const existingResults = await this.get<any[]>(CACHE_KEYS.AI_SCANNER_RESULTS) || [];
    
    // Aggiungi nuovo risultato
    existingResults.unshift(result);
    
    // Mantieni solo ultimi 20 risultati
    const limitedResults = existingResults.slice(0, 20);
    
    await this.set(CACHE_KEYS.AI_SCANNER_RESULTS, limitedResults, DEFAULT_TTL.AI_SCANNER_RESULTS);
  }

  // Recupera risultati scanner
  async getScannerResults(): Promise<any[] | null> {
    return await this.get(CACHE_KEYS.AI_SCANNER_RESULTS);
  }

  // Salva messaggi Coach Maya
  async cacheCoachMessages(messages: any[]): Promise<void> {
    // Mantieni solo ultimi 50 messaggi
    const limitedMessages = messages.slice(-50);
    await this.set(CACHE_KEYS.COACH_MESSAGES, limitedMessages, DEFAULT_TTL.COACH_MESSAGES);
  }

  // Recupera messaggi Coach
  async getCoachMessages(): Promise<any[] | null> {
    return await this.get(CACHE_KEYS.COACH_MESSAGES);
  }

  // Salva piani pasto
  async cacheMealPlans(plans: any[]): Promise<void> {
    await this.set(CACHE_KEYS.MEAL_PLANS, plans, DEFAULT_TTL.MEAL_PLANS);
  }

  // Recupera piani pasto
  async getMealPlans(): Promise<any[] | null> {
    return await this.get(CACHE_KEYS.MEAL_PLANS);
  }

  // Database cibi comuni (per fallback offline)
  async cacheFoodDatabase(foods: any[]): Promise<void> {
    await this.set(CACHE_KEYS.FOOD_DATABASE, foods, DEFAULT_TTL.FOOD_DATABASE);
  }

  // Recupera database cibi
  async getFoodDatabase(): Promise<any[] | null> {
    return await this.get(CACHE_KEYS.FOOD_DATABASE);
  }

  // --- Offline Queue Management ---

  // Aggiungi operazione a coda offline
  async addToOfflineQueue(operation: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      
      const newItem: OfflineQueueItem = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        ...operation,
        timestamp: Date.now(),
        retries: 0,
      };

      queue.push(newItem);
      await this.set(CACHE_KEYS.OFFLINE_QUEUE, queue);
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  }

  // Recupera coda offline
  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    return await this.get<OfflineQueueItem[]>(CACHE_KEYS.OFFLINE_QUEUE) || [];
  }

  // Rimuovi item da coda
  async removeFromOfflineQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const updatedQueue = queue.filter(item => item.id !== itemId);
      await this.set(CACHE_KEYS.OFFLINE_QUEUE, updatedQueue);
    } catch (error) {
      console.error('Error removing from offline queue:', error);
    }
  }

  // Incrementa retry count
  async incrementRetryCount(itemId: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const updatedQueue = queue.map(item => 
        item.id === itemId 
          ? { ...item, retries: item.retries + 1 }
          : item
      );
      await this.set(CACHE_KEYS.OFFLINE_QUEUE, updatedQueue);
    } catch (error) {
      console.error('Error incrementing retry count:', error);
    }
  }

  // Clear coda offline
  async clearOfflineQueue(): Promise<void> {
    await this.set(CACHE_KEYS.OFFLINE_QUEUE, []);
  }

  // Salva timestamp ultima sync
  async setLastSyncTimestamp(): Promise<void> {
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
  }

  // Recupera timestamp ultima sync
  async getLastSyncTimestamp(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      return null;
    }
  }

  // Ottieni dimensione cache totale (per debug)
  async getCacheSize(): Promise<number> {
    try {
      const keys = Object.values(CACHE_KEYS);
      let totalSize = 0;

      for (const key of keys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += new Blob([item]).size;
        }
      }

      return totalSize; // in bytes
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }
}

export const cacheManager = new CacheManager();
export { CACHE_KEYS };
