import { Slot } from 'expo-router';
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
            <Slot />
          </AuthProvider>
        </OfflineProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
