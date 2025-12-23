import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Traduzioni per le notifiche
const notificationTranslations: Record<string, { enableNotifications: string; close: string }> = {
  it: {
    enableNotifications: 'Abilita le notifiche per ricevere promemoria sui pasti!',
    close: 'Chiudi'
  },
  en: {
    enableNotifications: 'Enable notifications to receive meal reminders!',
    close: 'Close'
  },
  es: {
    enableNotifications: '¡Activa las notificaciones para recibir recordatorios de comidas!',
    close: 'Cerrar'
  }
};

// Configurazione notifiche
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registra il device per ricevere push notifications
 */
export async function registerForPushNotificationsAsync(userEmail: string, language: string = 'it') {
  let token;

  // Get translations for current language
  const t = notificationTranslations[language] || notificationTranslations.it;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00897B',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(t.enableNotifications, '', [{ text: t.close }]);
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    console.log('Push Token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  // Registra il token nel backend
  if (token) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/push-token/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: userEmail,
          push_token: token,
          device_type: Platform.OS,
          language: language,
        }),
      });

      if (response.ok) {
        console.log('Push token registered successfully');
        await AsyncStorage.setItem('pushTokenRegistered', 'true');
      } else {
        console.error('Failed to register push token:', await response.text());
      }
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  return token;
}

/**
 * Ottiene le preferenze notifiche dell'utente
 */
export async function getNotificationPreferences(userEmail: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/push-token/preferences/${encodeURIComponent(userEmail)}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error getting notification preferences:', error);
  }
  
  // Default preferences
  return {
    enabled: true,
    lunch_time: '12:30',
    dinner_time: '19:30',
    evening_reminder: '21:00',
    weekly_report_day: 6,
    weekly_report_time: '20:00',
    max_daily_notifications: 4,
  };
}

/**
 * Aggiorna le preferenze notifiche
 */
export async function updateNotificationPreferences(userEmail: string, preferences: any) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/push-token/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: userEmail,
        ...preferences,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

/**
 * Invia una notifica push test
 */
export async function sendTestNotification(userEmail: string, title: string, body: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/push-token/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: userEmail,
        title,
        body,
        data: { type: 'test' },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}

/**
 * Setup dei listener per le notifiche
 */
export function setupNotificationListeners() {
  // Listener quando la notifica viene ricevuta mentre l'app è in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Listener quando l'utente clicca sulla notifica
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification clicked:', response);
    const data = response.notification.request.content.data;
    
    // TODO: Naviga alla schermata appropriata basandoti su data.type
    // Es: se data.type === 'meal_reminder', vai a /scanner
  });

  return {
    notificationListener,
    responseListener,
  };
}

/**
 * Rimuove i listener
 */
export function removeNotificationListeners(listeners: any) {
  Notifications.removeNotificationSubscription(listeners.notificationListener);
  Notifications.removeNotificationSubscription(listeners.responseListener);
}
