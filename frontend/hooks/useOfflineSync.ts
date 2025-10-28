import { useEffect, useCallback } from 'react';
import { useOffline } from '../contexts/OfflineContext';
import { cacheManager } from '../utils/cacheManager';
import axios from 'axios';

// Custom hook per gestire cache e sync offline
export const useOfflineSync = () => {
  const { isOnline } = useOffline();

  // Wrapper per chiamate API con supporto offline
  const apiCall = useCallback(async <T,>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any,
    options?: {
      cache?: boolean;
      cacheKey?: string;
      cacheTTL?: number;
      offlineQueue?: boolean;
    }
  ): Promise<T | null> => {
    const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

    // Se online, prova chiamata normale
    if (isOnline) {
      try {
        const response = await axios({
          method,
          url: `${API_URL}${endpoint}`,
          data,
          timeout: 15000,
        });

        // Cache response se richiesto
        if (options?.cache && options?.cacheKey && method === 'GET') {
          await cacheManager.set(options.cacheKey, response.data, options.cacheTTL);
        }

        return response.data;
      } catch (error: any) {
        console.error(`API call failed: ${method} ${endpoint}`, error.message);
        
        // Se GET, prova a recuperare da cache
        if (method === 'GET' && options?.cache && options?.cacheKey) {
          const cached = await cacheManager.get<T>(options.cacheKey);
          if (cached) {
            console.log(`Using cached data for ${endpoint}`);
            return cached;
          }
        }

        throw error;
      }
    }

    // Modalità offline
    console.log(`Offline mode: handling ${method} ${endpoint}`);

    // GET: recupera da cache
    if (method === 'GET') {
      if (options?.cache && options?.cacheKey) {
        const cached = await cacheManager.get<T>(options.cacheKey);
        if (cached) {
          return cached;
        }
      }
      throw new Error('No cached data available offline');
    }

    // POST/PUT/DELETE: aggiungi a offline queue
    if (options?.offlineQueue !== false) {
      await cacheManager.addToOfflineQueue({
        endpoint,
        method,
        data,
      });
      console.log(`Added to offline queue: ${method} ${endpoint}`);
      return null; // Indica che è in queue
    }

    throw new Error('Operation not available offline');
  }, [isOnline]);

  // Salva dati utente in cache
  const cacheUserData = useCallback(async (userData: any) => {
    await cacheManager.cacheUserProfile(userData);
  }, []);

  // Salva profili bambini in cache
  const cacheChildren = useCallback(async (children: any[]) => {
    await cacheManager.cacheChildrenProfiles(children);
  }, []);

  // Salva diary entries in cache
  const cacheDiaryEntries = useCallback(async (entries: any[]) => {
    await cacheManager.cacheDiaryEntries(entries);
  }, []);

  return {
    apiCall,
    cacheUserData,
    cacheChildren,
    cacheDiaryEntries,
    isOnline,
  };
};