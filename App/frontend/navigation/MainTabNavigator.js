import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { useFonts } from '../hooks/useFonts';
import { scale } from '../utils/responsive';

const Tab = createBottomTabNavigator();

/**
 * Icono de pestaña con píldora de fondo cuando está activo.
 * Mejora la visibilidad de la pestaña seleccionada para personas mayores.
 * @param {Object} props
 * @param {string} props.emoji - Emoji del icono.
 * @param {boolean} props.focused - Si la pestaña está activa.
 * @param {string} props.label - Texto de la pestaña.
 */
function TabIcon({ emoji, focused, label }) {
  const f = useFonts();
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{emoji}</Text>
      <Text style={[styles.tabIconLabel, focused && styles.tabIconLabelActive, { fontSize: focused ? Math.round(f.small * 0.75) : Math.round(f.small * 0.69) }]}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Navegador de pestañas inferior con 4 secciones principales.
 * Diseñado con etiquetas grandes y emojis para accesibilidad (personas mayores).
 */
export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Juegos"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎮" focused={focused} label="Juegos" />
          ),
          tabBarAccessibilityLabel: 'Juegos',
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" focused={focused} label="Perfil" />
          ),
          tabBarAccessibilityLabel: 'Perfil',
        }}
      />
      <Tab.Screen
        name="Estadísticas"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" focused={focused} label="Estadísticas" />
          ),
          tabBarAccessibilityLabel: 'Estadísticas',
        }}
      />
      <Tab.Screen
        name="Ajustes"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" focused={focused} label="Ajustes" />
          ),
          tabBarAccessibilityLabel: 'Ajustes',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: scale(80),
    paddingBottom: scale(10),
    paddingTop: scale(8),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGreen,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(4),
    borderRadius: scale(16),
  },
  tabIconContainerActive: {
    backgroundColor: colors.lightGreen,
  },
  icon: {
    fontSize: scale(22),
  },
  iconActive: {
    fontSize: scale(26),
  },
  tabIconLabel: {
    fontSize: scale(11),
    color: colors.border,
    marginTop: scale(2),
  },
  tabIconLabelActive: {
    fontSize: scale(12),
    color: colors.primary,
    fontWeight: fonts.bold,
  },
});
