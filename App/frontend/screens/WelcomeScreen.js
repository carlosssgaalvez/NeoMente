import React, { useContext, useMemo } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../constants/colors';
import { useFonts } from '../hooks/useFonts';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

/**
 * Pantalla de bienvenida — primera pantalla visible al abrir la app.
 * Muestra el logo y tres opciones: Jugar (invitado), Iniciar Sesión, Crear Cuenta.
 * Accesibilidad: botones grandes, alto contraste, espaciado generoso,
 * textos legibles para personas de la tercera edad.
 */
export default function WelcomeScreen({ navigation }) {
  const { loginAsGuest, isLoading, isAuthenticated, user, isGuest, logout } = useContext(AuthContext);
  const f = useFonts();
  const styles = useMemo(() => getStyles(f), [f]);

  // Solo usuarios registrados (no invitados) ven la versión personalizada
  const isRegistered = isAuthenticated && !isGuest;

  const handlePlay = async () => {
    if (isAuthenticated) {
      navigation.navigate('MainTabs');
      return;
    }
    try {
      await loginAsGuest();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const nombreUsuario = user?.nombre || user?.usuario || '';

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Decoración superior — oculta para lectores de pantalla */}
      <View style={styles.topDecoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle5} />
      </View>

      <View style={styles.content}>
        <Card>
          <Image
            source={require('../assets/images/NeomenteLogo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Logo de NeoMente: un cerebro animado levantando pesas"
          />

          <Text style={styles.title} accessibilityRole="header">
            NeoMente
          </Text>
          <Text style={styles.subtitle}>Entrena tu mente jugando</Text>

          <View style={styles.welcomeBadge}>
            <Text style={styles.welcomeText}>
              {isRegistered ? `¡Bienvenido, ${nombreUsuario}!` : '¡Bienvenido!'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Botón JUGAR */}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handlePlay}
            activeOpacity={0.82}
            accessible
            accessibilityRole="button"
            accessibilityLabel={isRegistered ? 'Jugar' : 'Jugar sin crear cuenta'}
            accessibilityHint={isRegistered ? 'Ir a los juegos' : 'Entra como invitado para jugar directamente'}
          >
            <Text style={styles.btnEmoji} importantForAccessibility="no">🎮</Text>
            <View style={styles.btnTextBlock}>
              <Text style={styles.btnPrimaryTitle}>JUGAR</Text>
              {!isRegistered && (
                <Text style={styles.btnPrimarySubtitle}>Sin crear cuenta</Text>
              )}
            </View>
            <Text style={styles.btnArrow} importantForAccessibility="no">›</Text>
          </TouchableOpacity>

          {/* Botón Iniciar Sesión — solo si no está registrado */}
          {!isRegistered && (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.82}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión con tu cuenta"
            >
              <Text style={styles.btnEmoji} importantForAccessibility="no">🔑</Text>
              <Text style={styles.btnSecondaryText}>Iniciar Sesión</Text>
              <Text style={styles.btnArrowDark} importantForAccessibility="no">›</Text>
            </TouchableOpacity>
          )}

          {/* Botón Crear Cuenta — deshabilitado si es usuario registrado */}
          <TouchableOpacity
            style={[styles.btnOutline, isRegistered && styles.btnDisabled]}
            onPress={isRegistered ? undefined : () => navigation.navigate('Register')}
            activeOpacity={isRegistered ? 1 : 0.82}
            disabled={isRegistered}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Crear cuenta nueva"
            accessibilityState={{ disabled: isRegistered }}
          >
            <Text style={[styles.btnEmoji, isRegistered && styles.btnDisabledText]} importantForAccessibility="no">📝</Text>
            <Text style={[styles.btnOutlineText, isRegistered && styles.btnDisabledText]}>Crear Cuenta</Text>
            <Text style={[styles.btnArrowGreen, isRegistered && styles.btnDisabledText]} importantForAccessibility="no">›</Text>
          </TouchableOpacity>

          {/* Botón Cerrar Sesión — solo si es usuario registrado */}
          {isRegistered && (
            <TouchableOpacity
              style={styles.btnLogout}
              onPress={() =>
                Alert.alert(
                  'Cerrar sesión',
                  '¿Estás seguro de que quieres cerrar sesión?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
                  ],
                )
              }
              activeOpacity={0.82}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
            >
              <Text style={styles.btnEmoji} importantForAccessibility="no">🚪</Text>
              <Text style={styles.btnLogoutText}>Cerrar Sesión</Text>
              <Text style={styles.btnArrowRed} importantForAccessibility="no">›</Text>
            </TouchableOpacity>
          )}
        </Card>
      </View>

      {/* Decoración inferior — oculta para lectores de pantalla */}
      <View style={styles.bottomDecoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.circle3} />
        <View style={styles.circle4} />
        <View style={styles.circle6} />
      </View>
    </View>
  );
}

const getStyles = (f) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topDecoration: {
    position: 'absolute',
    top: -40, left: 0, right: 0, height: 200,
  },
  circle1: {
    position: 'absolute', top: -30, left: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle2: {
    position: 'absolute', top: -10, right: -40,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circle5: {
    position: 'absolute', top: 60, left: '40%',
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: -40, left: 0, right: 0, height: 200,
  },
  circle3: {
    position: 'absolute', bottom: -20, right: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle4: {
    position: 'absolute', bottom: 10, left: -40,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  circle6: {
    position: 'absolute', bottom: 50, left: '50%',
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: f.s(40),
  },
  logo: {
    width: f.s(180), height: f.s(180), marginBottom: f.s(8),
  },
  title: {
    fontSize: f.h1, fontWeight: f.bold,
    color: colors.primary, textAlign: 'center', marginBottom: 4,
  },
  subtitle: {
    fontSize: f.body, fontWeight: f.normal,
    color: colors.lightText, textAlign: 'center', marginBottom: 4,
  },
  welcomeBadge: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: f.s(24), paddingVertical: f.s(8),
    borderRadius: f.s(20), marginTop: f.s(8), marginBottom: f.s(4),
  },
  welcomeText: {
    fontSize: f.small, fontWeight: f.semibold,
    color: colors.primary, textAlign: 'center',
  },
  divider: {
    width: '60%', height: 2,
    backgroundColor: colors.lightGreen, borderRadius: 1, marginVertical: f.s(18),
  },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch',
    backgroundColor: colors.primary, borderRadius: f.s(16),
    paddingVertical: f.s(18), paddingHorizontal: f.s(20),
    marginBottom: f.s(10), minHeight: f.s(64),
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 10, elevation: 8,
  },
  btnEmoji: { fontSize: f.s(28), marginRight: f.s(14) },
  btnTextBlock: { flex: 1 },
  btnPrimaryTitle: {
    fontSize: f.h2, fontWeight: '800',
    color: colors.white, letterSpacing: 1.5,
  },
  btnPrimarySubtitle: {
    fontSize: f.small, color: 'rgba(255,255,255,0.9)', marginTop: 2,
  },
  btnArrow: { fontSize: f.s(32), color: 'rgba(255,255,255,0.9)', fontWeight: '300' },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch',
    backgroundColor: '#F1F8E9', borderRadius: f.s(14),
    paddingVertical: f.s(16), paddingHorizontal: f.s(20),
    marginBottom: f.s(10), minHeight: f.s(56), borderWidth: 1.5, borderColor: '#A5D6A7',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  btnSecondaryText: {
    flex: 1, fontSize: f.body, fontWeight: f.semibold, color: colors.primary,
  },
  btnArrowDark: { fontSize: f.s(28), color: colors.primary, fontWeight: '300' },
  btnOutline: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch',
    backgroundColor: colors.white, borderRadius: f.s(14),
    paddingVertical: f.s(16), paddingHorizontal: f.s(20),
    minHeight: f.s(56), borderWidth: 2, borderColor: colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  btnOutlineText: {
    flex: 1, fontSize: f.body, fontWeight: f.semibold, color: colors.primary,
  },
  btnArrowGreen: { fontSize: f.s(28), color: colors.primary, fontWeight: '300' },
  btnDisabled: {
    backgroundColor: '#F5F5F5', borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  btnDisabledText: {
    color: '#BDBDBD',
  },
  btnLogout: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch',
    backgroundColor: '#FFEBEE', borderRadius: f.s(14),
    paddingVertical: f.s(16), paddingHorizontal: f.s(20),
    marginTop: f.s(10), minHeight: f.s(56), borderWidth: 1.5, borderColor: '#EF9A9A',
  },
  btnLogoutText: {
    flex: 1, fontSize: f.body, fontWeight: f.semibold, color: '#C62828',
  },
  btnArrowRed: { fontSize: f.s(28), color: '#C62828', fontWeight: '300' },
});
