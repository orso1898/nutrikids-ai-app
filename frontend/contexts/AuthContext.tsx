import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../utils/pushNotifications';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  isAdmin: boolean;
  authToken: string | null;
  login: (email: string, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      const token = await AsyncStorage.getItem('authToken');
      if (email) {
        setIsAuthenticated(true);
        setUserEmail(email);
        setIsAdmin(email === 'admin@nutrikids.com');
        setAuthToken(token);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, token?: string) => {
    try {
      await AsyncStorage.setItem('userEmail', email);
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }
      setIsAuthenticated(true);
      setUserEmail(email);
      setIsAdmin(email === 'admin@nutrikids.com');
      setAuthToken(token || null);

      // Registra per le notifiche push - ottieni la lingua da AsyncStorage
      const savedLanguage = await AsyncStorage.getItem('language') || 'it';
      registerForPushNotificationsAsync(email, savedLanguage).catch(err => 
        console.error('Failed to register push notifications:', err)
      );
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('hasSeenOnboarding');
      setIsAuthenticated(false);
      setUserEmail(null);
      setIsAdmin(false);
      setAuthToken(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, isAdmin, authToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};