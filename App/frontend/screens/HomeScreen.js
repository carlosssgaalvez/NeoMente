import React, { useContext, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { colors } from '../constants/colors';
import { useFonts } from '../hooks/useFonts';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import { getJuegos } from '../services/dataService';

/**
 * Emojis asociados a cada área cognitiva para identificación visual rápida.
 */
const AREA_CONFIG = {
  Memoria:  { emoji: '🧠', color: '#1B5E20' },
  Atención: { emoji: '🎯', color: '#0D47A1' },
  Lenguaje: { emoji: '📖', color: '#E65100' },
};

/**
 * Emojis individuales por nombre de juego.
 */
const JUEGO_EMOJIS = {
  'Jardín de la Memoria': '🌻',
  'El Mercado': '🛒',
  'La Receta de la Abuela': '🍲',
  'El Semáforo': '🚦',
  'Cazamariposas': '🦋',
  'El Vigilante': '👁️',
  'Refranes Perdidos': '📜',
  'La Oveja Perdida': '🐑',
  'El Reloj de Letras': '🕰️',
};

/**
 * Mapea nombres de juegos a sus pantallas de navegación.
 */
const JUEGO_SCREENS = {
  'Jardín de la Memoria': 'GardenMemory',
  'El Mercado': 'MarketMemory',
  'La Receta de la Abuela': 'RecipeMemory',
  'El Semáforo': 'StroopGame',
  'Cazamariposas': 'ButterflyGame',
  'El Vigilante': 'VigilantGame',
  'Refranes Perdidos': 'ProverbGame',
  'La Oveja Perdida': 'ShepherdGame',
  'El Reloj de Letras': 'WatchmakerGame',
};

/**
 * Pantalla principal de juegos.
 * Muestra los juegos agrupados por área cognitiva (Memoria, Atención, Lenguaje).
 * Accesibilidad: tarjetas grandes, alto contraste, textos legibles.
 */
export default function HomeScreen({ navigation }) {
  const { user, isGuest, logout } = useContext(AuthContext);
  const f = useFonts();
  const styles = useMemo(() => getStyles(f), [f]);
  const [juegos, setJuegos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarJuegos = async () => {
      try {
        const data = await getJuegos();
        setJuegos(data);
      } catch {
        setJuegos([]);
      } finally {
        setLoading(false);
      }
    };
    cargarJuegos();
  }, []);

  const nombreUsuario = user?.nombre || user?.usuario || 'Invitado';

  // Agrupar juegos por area_cognitiva
  const juegosPorArea = juegos.reduce((acc, juego) => {
    const area = juego.area_cognitiva;
    if (!acc[area]) acc[area] = [];
    acc[area].push(juego);
    return acc;
  }, {});

  const areas = ['Memoria', 'Atención', 'Lenguaje'];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Cabecera */}
      <View style={styles.headerWrapper}>
        {/* Capa de fondo oscura para degradado manual */}
        <View style={styles.headerGradientTop} />
        <View style={styles.headerGradientBottom} />

        {/* Círculos decorativos — ocultos para lectores de pantalla */}
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
          <View style={styles.headerCircle3} />
          <View style={styles.headerCircle4} />
          <View style={styles.headerCircle5} />
          <View style={styles.headerRing1} />
          <View style={styles.headerRing2} />
        </View>

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Welcome')}
            accessibilityRole="button"
            accessibilityLabel="Volver a la pantalla de bienvenida"
          >
            <Text style={styles.backButtonText}>← Salir</Text>
          </TouchableOpacity>

          {/* Logo con brillo */}
          <View style={styles.logoGlow}>
            <Image
              source={require('../assets/images/NeomenteLogo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
              accessibilityLabel="Logo de NeoMente"
            />
          </View>

          <Text style={styles.welcome} accessibilityRole="header">
            Hola, {nombreUsuario}
          </Text>
          <View style={styles.headerDivider} />
          <Text style={styles.subtitle}>
            Elige un juego y entrena tu mente
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {isGuest ? '👤 Modo invitado' : '✅ Cuenta personal'}
            </Text>
          </View>
        </View>

        {/* Curva inferior */}
        <View style={styles.headerCurve} />
      </View>

      {/* Secciones de juegos por categoría */}
      <View style={styles.content}>
        <Text style={styles.sectionHeader} accessibilityRole="header">
          JUEGOS:
        </Text>

        {areas.map((area) => {
          const config = AREA_CONFIG[area] || { emoji: '🎮', color: colors.primary };
          const juegosArea = juegosPorArea[area] || [];

          return (
            <View key={area} style={styles.categorySection}>
              {/* Título de categoría */}
              <View style={[styles.categoryHeader, { borderLeftColor: config.color }]}>
                <Text style={styles.categoryEmoji}>{config.emoji}</Text>
                <Text style={[styles.categoryTitle, { color: config.color }]}>
                  {area}
                </Text>
              </View>

              {/* Tarjetas de juegos */}
              {juegosArea.length > 0 ? (
                juegosArea.map((juego) => {
                  const screenName = JUEGO_SCREENS[juego.nombre];
                  return (
                  <TouchableOpacity
                    key={juego.id}
                    style={[styles.gameCard, !screenName && styles.gameCardDisabled]}
                    activeOpacity={screenName ? 0.7 : 1}
                    accessibilityRole="button"
                    accessibilityLabel={`Jugar a ${juego.nombre}. ${juego.descripcion}`}
                    accessibilityState={{ disabled: !screenName }}
                    onPress={() => {
                      if (screenName) {
                        navigation.navigate(screenName, { juegoId: juego.id });
                      } else {
                        Alert.alert('Próximamente', `${juego.nombre} estará disponible pronto`);
                      }
                    }}
                  >
                    <Text style={styles.gameEmoji}>
                      {JUEGO_EMOJIS[juego.nombre] || '🎮'}
                    </Text>
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameName}>{juego.nombre}</Text>
                      <Text style={styles.gameDesc}>{juego.descripcion}</Text>
                      {!screenName && (
                        <Text style={styles.comingSoon}>Próximamente</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>No hay juegos en esta categoría</Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const getStyles = (f) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: f.s(20),
  },
  headerWrapper: {
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  headerGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  headerGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerCircle1: {
    position: 'absolute',
    top: -50,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerCircle2: {
    position: 'absolute',
    top: 10,
    right: -45,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerCircle3: {
    position: 'absolute',
    bottom: 50,
    left: '30%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerCircle4: {
    position: 'absolute',
    top: 80,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(200,230,201,0.1)',
  },
  headerCircle5: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(200,230,201,0.08)',
  },
  headerRing1: {
    position: 'absolute',
    top: 30,
    right: 50,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'transparent',
  },
  headerRing2: {
    position: 'absolute',
    bottom: 90,
    left: 30,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: f.s(50),
    paddingBottom: f.s(34),
    paddingHorizontal: f.s(24),
    alignItems: 'center',
  },
  headerDivider: {
    width: 50,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginBottom: 12,
  },
  headerCurve: {
    height: 30,
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -6,
  },
  logoGlow: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: f.s(50),
    padding: f.s(8),
    marginBottom: f.s(10),
  },
  headerLogo: {
    width: f.s(80),
    height: f.s(80),
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  welcome: {
    fontSize: f.h1,
    fontWeight: f.bold,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: f.body,
    color: colors.lightGreen,
    textAlign: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: f.s(16),
    paddingVertical: f.s(6),
    borderRadius: f.s(20),
  },
  badgeText: {
    color: colors.white,
    fontSize: f.small,
    fontWeight: f.semibold,
  },
  content: {
    padding: f.s(20),
  },
  sectionHeader: {
    fontSize: f.h2,
    fontWeight: f.bold,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    paddingLeft: f.s(12),
    marginBottom: f.s(12),
  },
  categoryEmoji: {
    fontSize: f.s(26),
    marginRight: f.s(10),
  },
  categoryTitle: {
    fontSize: f.h2,
    fontWeight: f.bold,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: f.s(16),
    padding: f.s(16),
    marginBottom: f.s(12),
    marginLeft: f.s(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  gameCardDisabled: {
    opacity: 0.55,
  },
  gameEmoji: {
    fontSize: f.s(36),
    marginRight: f.s(16),
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: f.body,
    fontWeight: f.bold,
    color: colors.text,
    marginBottom: 4,
  },
  gameDesc: {
    fontSize: f.small,
    color: colors.lightText,
    lineHeight: 22,
  },
  comingSoon: {
    fontSize: 12,
    color: colors.placeholder,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyText: {
    fontSize: f.small,
    color: colors.lightText,
    fontStyle: 'italic',
    marginLeft: 16,
  },
});
