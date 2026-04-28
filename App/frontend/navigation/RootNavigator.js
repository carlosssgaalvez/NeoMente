import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import GardenMemoryScreen from '../screens/games/GardenMemoryScreen';
import MarketMemoryScreen from '../screens/games/MarketMemoryScreen';
import RecipeMemoryScreen from '../screens/games/RecipeMemoryScreen';
import StroopGameScreen from '../screens/games/StroopGameScreen';
import ButterflyGameScreen from '../screens/games/ButterflyGameScreen';
import VigilantGameScreen from '../screens/games/VigilantGameScreen';
import ProverbGameScreen from '../screens/games/ProverbGameScreen';
import ShepherdGameScreen from '../screens/games/ShepherdGameScreen';
import WatchmakerGameScreen from '../screens/games/WatchmakerGameScreen';
import MainTabNavigator from './MainTabNavigator';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

const Stack = createStackNavigator();

/**
 * Navegador raíz — controla el flujo según el estado de autenticación.
 * Si el usuario tiene sesión (registrado o invitado), va a las pestañas principales.
 * Si no, muestra la pantalla de bienvenida con opciones de login/registro/jugar.
 */
export default function RootNavigator() {
  const { isAuthenticated, isLoading, isGuest } = useContext(AuthContext);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="GardenMemory" component={GardenMemoryScreen} />
            <Stack.Screen name="MarketMemory" component={MarketMemoryScreen} />
            <Stack.Screen name="RecipeMemory" component={RecipeMemoryScreen} />
            <Stack.Screen name="StroopGame" component={StroopGameScreen} />
            <Stack.Screen name="ButterflyGame" component={ButterflyGameScreen} />
            <Stack.Screen name="VigilantGame" component={VigilantGameScreen} />
            <Stack.Screen name="ProverbGame" component={ProverbGameScreen} />
            <Stack.Screen name="ShepherdGame" component={ShepherdGameScreen} />
            <Stack.Screen name="WatchmakerGame" component={WatchmakerGameScreen} />
            {isGuest && (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            )}
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
