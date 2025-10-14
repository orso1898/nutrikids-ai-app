import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="language-selection" />
            <Stack.Screen name="login" />
            <Stack.Screen name="home" />
            <Stack.Screen name="coach-maya" />
            <Stack.Screen name="scanner" />
            <Stack.Screen name="piani" />
            <Stack.Screen name="diario" />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="premium" />
            <Stack.Screen name="profilo" />
          </Stack>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}