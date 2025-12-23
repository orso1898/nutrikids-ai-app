import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { OfflineProvider } from '../contexts/OfflineContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <OfflineProvider>
          <AuthProvider>
            <Stack 
              screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen 
                name="index" 
                options={{
                  animation: 'fade',
                }}
              />
              <Stack.Screen 
                name="language-selection" 
                options={{
                  animation: 'fade',
                }}
              />
              <Stack.Screen 
                name="login" 
                options={{
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen 
                name="register" 
                options={{
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen 
                name="home" 
                options={{
                  animation: 'fade',
                }}
              />
              <Stack.Screen name="coach-maya" />
              <Stack.Screen name="scanner" />
              <Stack.Screen name="piani" />
              <Stack.Screen name="diario" />
              <Stack.Screen name="dashboard" />
              <Stack.Screen 
                name="premium" 
                options={{
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen name="profilo" />
              <Stack.Screen 
                name="edit-child" 
                options={{
                  animation: 'slide_from_bottom',
                  presentation: 'modal',
                }}
              />
              <Stack.Screen name="admin-dashboard" />
              <Stack.Screen name="admin-config" />
              <Stack.Screen name="impostazioni" />
              <Stack.Screen name="info" />
              <Stack.Screen name="aiuto" />
              <Stack.Screen name="invita-amici" />
              <Stack.Screen name="privacy-policy" />
              <Stack.Screen name="terms-of-service" />
              <Stack.Screen name="forgot-password" />
              <Stack.Screen name="reset-password" />
              <Stack.Screen name="welcome-premium" />
            </Stack>
          </AuthProvider>
        </OfflineProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
