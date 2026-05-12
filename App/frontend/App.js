import React from 'react';
import { Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import RootNavigator from './navigation/RootNavigator';

// Desactivar completamente el escalado automático del SO para Text/TextInput.
// NeoMente gestiona el tamaño de texto únicamente desde sus propios ajustes.
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;
Text.defaultProps.maxFontSizeMultiplier = 1;
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;
TextInput.defaultProps.maxFontSizeMultiplier = 1;

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
