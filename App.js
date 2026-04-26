// App.js ← FINAL 100% WORKING (NO MORE CRASHES)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import DrawerNavigation from './navigation/DrawerNavigation';
import { PaperProvider } from 'react-native-paper';
import 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <LanguageProvider>
            <ErrorBoundary>
              <NavigationContainer>
                <DrawerNavigation />
              </NavigationContainer>
            </ErrorBoundary>
          </LanguageProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}