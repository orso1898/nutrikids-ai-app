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
              animationDuration: 300,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              customAnimationOnGesture: true,
              fullScreenGestureEnabled: false,
            }}
          >
            <Stack.Screen 
              name="index" 
              options={{
                animation: 'fade',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="language-selection" 
              options={{
                animation: 'fade',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="login" 
              options={{
                animation: 'slide_from_bottom',
                animationDuration: 350,
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
                animationDuration: 400,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="coach-maya" 
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="scanner" 
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="piani" 
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="diario" 
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="dashboard" 
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="premium" 
              options={{
                animation: 'slide_from_bottom',
                animationDuration: 350,
              }}
            />
            <Stack.Screen 
              name="profilo" 
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="edit-child" 
              options={{
                animation: 'slide_from_bottom',
                animationDuration: 350,
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="admin-dashboard" 
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="admin-config" 
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="impostazioni" 
              options={{
                animation: 'slide_from_right',
              }}
            />
          </Stack>
        </AuthProvider>
      </OfflineProvider>
    </LanguageProvider>
  </SafeAreaProvider>
  );
}