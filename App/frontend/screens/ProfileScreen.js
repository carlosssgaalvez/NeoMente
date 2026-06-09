import React, { useContext, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity,
  Keyboard, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { useFonts } from '../hooks/useFonts';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import { isValidPassword, isValidUsername } from '../utils/validation';
import { actualizarPerfil, cambiarPassword } from '../api/authServices';
import { getEstadisticas } from '../services/dataService';

/**
 * Calcula el nivel de robustez de una contraseña (0–5).
 * @param {string} pwd
 * @returns {{ level: number, label: string, color: string }}
 */
function getPasswordStrength(pwd) {
  if (!pwd) return { level: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 1, label: 'Muy débil', color: '#D32F2F' };
  if (score === 2) return { level: 2, label: 'Débil', color: '#F57C00' };
  if (score === 3) return { level: 3, label: 'Media', color: '#FBC02D' };
  if (score === 4) return { level: 4, label: 'Fuerte', color: '#388E3C' };
  return { level: 5, label: 'Muy fuerte', color: '#1B5E20' };
}

/**
 * Pantalla de perfil del usuario.
 * - Registrados: datos personales editables, cambio de contraseña, estadísticas.
 * - Invitados: incentivo para crear cuenta + formulario de conversión.
 */
export default function ProfileScreen() {
  const { user, isGuest, convertGuest, refreshUser, isLoading, login, logout } = useContext(AuthContext);
  const scrollRef = useRef(null);
  const f = useFonts();
  const styles = useMemo(() => getStyles(f), [f]);

  // --- Estado para login (invitados) ---
  const [showLoginSection, setShowLoginSection] = useState(false);
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({});
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // --- Estado para invitados (conversión) ---
  const [convNombre, setConvNombre] = useState('');
  const [convUsuario, setConvUsuario] = useState('');
  const [convPassword, setConvPassword] = useState('');
  const [convConfirm, setConvConfirm] = useState('');
  const [convErrors, setConvErrors] = useState({});
  const [convSubmitting, setConvSubmitting] = useState(false);

  // --- Estado para editar perfil (registrados) ---
  const [editNombre, setEditNombre] = useState('');
  const [editUsuario, setEditUsuario] = useState('');
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // --- Estado para cambiar contraseña ---
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [pwdActual, setPwdActual] = useState('');
  const [pwdNueva, setPwdNueva] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  // --- Estadísticas ---
  const [stats, setStats] = useState(null);

  // Keyboard offset
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(show, (e) => setKeyboardHeight(e.endCoordinates.height));
    const s2 = Keyboard.addListener(hide, () => setKeyboardHeight(0));
    return () => { s1.remove(); s2.remove(); };
  }, []);

  // Cargar datos del usuario al montar / al cambiar de invitado a registrado
  useEffect(() => {
    if (user && !user.es_invitado) {
      setEditNombre(user.nombre || '');
      setEditUsuario(user.usuario || '');
    }
  }, [user]);

  // Cargar estadísticas (se refresca cada vez que se vuelve a la pantalla)
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const cargar = async () => {
        try {
          const data = await getEstadisticas();
          if (mounted) setStats(data);
        } catch {
          // Sin estadísticas — no bloquear
        }
      };
      if (user) cargar();
      return () => { mounted = false; };
    }, [user])
  );

  // Indicador de robustez (para conversión y cambio de contraseña)
  const convStrength = useMemo(() => getPasswordStrength(convPassword), [convPassword]);
  const pwdStrength = useMemo(() => getPasswordStrength(pwdNueva), [pwdNueva]);

  // =========================================
  // HANDLERS: Login desde perfil (invitados)
  // =========================================
  const handleLoginChange = (field, setter) => (value) => {
    setter(value);
    if (loginErrors[field]) {
      setLoginErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleLogin = async () => {
    const errors = {};
    if (!loginUsuario.trim()) errors.usuario = 'Introduce tu usuario';
    if (!loginPassword) errors.password = 'Introduce tu contraseña';
    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }
    setLoginErrors({});
    setLoginSubmitting(true);
    try {
      await login(loginUsuario.trim(), loginPassword);
    } catch (err) {
      const msg = err.message || 'Error al iniciar sesión';
      setLoginErrors({ general: msg });
    } finally {
      setLoginSubmitting(false);
    }
  };

  // =========================================
  // HANDLERS: Conversión de invitado
  // =========================================
  const handleConvChange = (field, setter) => (value) => {
    setter(value);
    if (convErrors[field]) {
      setConvErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleConvert = async () => {
    const errors = {};
    if (!convNombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!convUsuario.trim()) errors.usuario = 'El usuario es obligatorio';
    else if (!isValidUsername(convUsuario.trim())) errors.usuario = 'Entre 3 y 50 caracteres';
    if (!convPassword) errors.password = 'La contraseña es obligatoria';
    else {
      const check = isValidPassword(convPassword);
      if (!check.valid) errors.password = check.message;
    }
    if (!convConfirm) errors.confirm = 'Confirma tu contraseña';
    else if (convPassword !== convConfirm) errors.confirm = 'Las contraseñas no coinciden';

    if (Object.keys(errors).length > 0) {
      setConvErrors(errors);
      return;
    }

    setConvErrors({});
    setConvSubmitting(true);
    try {
      await convertGuest(convNombre.trim(), convUsuario.trim(), convPassword);
      Alert.alert('¡Cuenta creada!', 'Tu progreso se ha conservado.');
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('usuario') || msg.toLowerCase().includes('existe')) {
        setConvErrors({ usuario: msg });
      } else {
        setConvErrors({ general: msg });
      }
    } finally {
      setConvSubmitting(false);
    }
  };

  // =========================================
  // HANDLERS: Editar perfil (registrados)
  // =========================================
  const handleEditChange = (field, setter) => (value) => {
    setter(value);
    setEditSuccess(false);
    if (editErrors[field]) {
      setEditErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      isGuest
        ? 'Si cierras sesión como invitado, podrás recuperar tu progreso al pulsar "Jugar" de nuevo (hasta 7 días).'
        : '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { await logout(); } },
      ],
    );
  };

  const hasEditChanges = user && !user.es_invitado && (
    editNombre !== (user.nombre || '') || editUsuario !== (user.usuario || '')
  );

  const handleCancelEdit = () => {
    setEditNombre(user?.nombre || '');
    setEditUsuario(user?.usuario || '');
    setEditErrors({});
    setEditSuccess(false);
  };

  const handleSaveProfile = async () => {
    const errors = {};
    if (!editNombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!editUsuario.trim()) errors.usuario = 'El usuario es obligatorio';
    else if (!isValidUsername(editUsuario.trim())) errors.usuario = 'Entre 3 y 50 caracteres';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setEditErrors({});
    setEditSubmitting(true);
    setEditSuccess(false);
    try {
      await actualizarPerfil({
        nombre: editNombre.trim(),
        usuario: editUsuario.trim(),
      });
      await refreshUser();
      setEditSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error al guardar';
      if (msg.toLowerCase().includes('usuario') || msg.toLowerCase().includes('existe')) {
        setEditErrors({ usuario: msg });
      } else {
        setEditErrors({ general: msg });
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  // =========================================
  // HANDLERS: Cambiar contraseña
  // =========================================
  const handlePwdChange = (field, setter) => (value) => {
    setter(value);
    if (pwdErrors[field]) {
      setPwdErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleChangePassword = async () => {
    const errors = {};
    if (!pwdActual) errors.actual = 'Introduce tu contraseña actual';
    if (!pwdNueva) errors.nueva = 'Introduce la nueva contraseña';
    else {
      const check = isValidPassword(pwdNueva);
      if (!check.valid) errors.nueva = check.message;
    }
    if (!pwdConfirm) errors.confirm = 'Confirma la nueva contraseña';
    else if (pwdNueva !== pwdConfirm) errors.confirm = 'Las contraseñas no coinciden';

    if (Object.keys(errors).length > 0) {
      setPwdErrors(errors);
      return;
    }

    setPwdErrors({});
    setPwdSubmitting(true);
    try {
      await cambiarPassword(pwdActual, pwdNueva);
      Alert.alert('Contraseña actualizada', 'Tu nueva contraseña ya está activa.');
      setPwdActual('');
      setPwdNueva('');
      setPwdConfirm('');
      setShowPasswordSection(false);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error al cambiar contraseña';
      if (msg.toLowerCase().includes('actual') || msg.toLowerCase().includes('incorrecta')) {
        setPwdErrors({ actual: msg });
      } else {
        setPwdErrors({ general: msg });
      }
    } finally {
      setPwdSubmitting(false);
    }
  };

  // =========================================
  // HELPERS
  // =========================================
  const fechaRegistro = user?.fecha_registro
    ? new Date(user.fecha_registro).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const inicial = (user?.nombre || user?.usuario || '?')[0].toUpperCase();

  const totalPartidas = useMemo(() => {
    if (!stats || !Array.isArray(stats)) return 0;
    return stats.reduce((sum, juego) => sum + (juego.resultados?.length || 0), 0);
  }, [stats]);

  const tiempoTotal = useMemo(() => {
    if (!stats || !Array.isArray(stats)) return 0;
    return stats.reduce((sum, juego) =>
      sum + (juego.resultados || []).reduce((s, r) => s + (r.duracion_segundos || 0), 0), 0);
  }, [stats]);
  const formatTiempo = (s) => {
    if (s < 60) return `${s} seg`;
    if (s < 3600) return `${Math.floor(s / 60)} min`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}min`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // ==============================
  // RENDER
  // ==============================
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* --- CABECERA --- */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{isGuest ? '👤' : inicial}</Text>
        </View>
        <Text style={styles.headerName} accessibilityRole="header">
          {isGuest ? 'Invitado' : (user?.nombre || user?.usuario || 'Usuario')}
        </Text>
        <View style={[styles.badge, isGuest ? styles.badgeGuest : styles.badgeRegistered]}>
          <Text style={styles.badgeText}>
            {isGuest ? '👤 Modo invitado' : '✅ Cuenta personal'}
          </Text>
        </View>
        {!isGuest && fechaRegistro ? (
          <Text style={styles.headerDate}>Miembro desde {fechaRegistro}</Text>
        ) : null}
      </View>

      <View style={styles.content}>
        {isGuest ? (
          /* ============================== */
          /* VISTA INVITADO                 */
          /* ============================== */
          <>
            {/* Estadísticas mini */}
            {totalPartidas > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>🎮</Text>
                  <Text style={styles.statValue}>{totalPartidas}</Text>
                  <Text style={styles.statLabel}>Partidas</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>⏱️</Text>
                  <Text style={styles.statValue}>{formatTiempo(tiempoTotal)}</Text>
                  <Text style={styles.statLabel}>Jugado</Text>
                </View>
              </View>
            )}

            {/* Incentivo */}
            <View style={styles.incentiveCard}>
              <Text style={styles.incentiveEmoji}>🌟</Text>
              <Text style={styles.incentiveTitle}>¡Crea tu cuenta!</Text>
              <Text style={styles.incentiveText}>
                Guarda tu progreso de forma permanente.{'\n'}
                Tus estadísticas actuales se conservarán.
              </Text>
            </View>

            {/* Sección: Iniciar sesión */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                🔑 ¿Ya tienes cuenta?
              </Text>

              {!showLoginSection ? (
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowLoginSection(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Iniciar sesión con cuenta existente"
                >
                  <Text style={styles.passwordToggleEmoji}>🔑</Text>
                  <View style={styles.passwordToggleContent}>
                    <Text style={styles.passwordToggleText}>Iniciar sesión</Text>
                    <Text style={styles.passwordToggleHint}>
                      Accede con tu cuenta existente
                    </Text>
                  </View>
                  <Text style={styles.passwordToggleArrow}>›</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.passwordForm}>
                  {loginErrors.general ? (
                    <View style={styles.errorBanner} accessibilityRole="alert">
                      <Text style={styles.errorBannerText}>{loginErrors.general}</Text>
                    </View>
                  ) : null}

                  <Input
                    label="Usuario"
                    value={loginUsuario}
                    onChangeText={handleLoginChange('usuario', setLoginUsuario)}
                    error={loginErrors.usuario}
                  />
                  <Input
                    label="Contraseña"
                    value={loginPassword}
                    onChangeText={handleLoginChange('password', setLoginPassword)}
                    secureTextEntry
                    error={loginErrors.password}
                  />

                  <View style={styles.passwordButtons}>
                    <Button
                      title={loginSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
                      onPress={handleLogin}
                      variant="primary"
                      size="large"
                      disabled={loginSubmitting}
                    />
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setShowLoginSection(false);
                        setLoginUsuario('');
                        setLoginPassword('');
                        setLoginErrors({});
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Cancelar inicio de sesión"
                    >
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Formulario de conversión */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Crear cuenta
              </Text>

              {convErrors.general ? (
                <View style={styles.errorBanner} accessibilityRole="alert">
                  <Text style={styles.errorBannerText}>{convErrors.general}</Text>
                </View>
              ) : null}

              <Input
                label="Nombre completo"
                value={convNombre}
                onChangeText={handleConvChange('nombre', setConvNombre)}
                error={convErrors.nombre}
              />
              <Input
                label="Usuario"
                value={convUsuario}
                onChangeText={handleConvChange('usuario', setConvUsuario)}
                error={convErrors.usuario}
              />
              <Input
                label="Contraseña"
                value={convPassword}
                onChangeText={handleConvChange('password', setConvPassword)}
                secureTextEntry
                error={convErrors.password}
              />

              {convPassword.length > 0 ? (
                <View style={styles.strengthContainer} accessibilityLabel={`Robustez: ${convStrength.label}`}>
                  <View style={styles.strengthBarBg}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthSegment,
                          { backgroundColor: i <= convStrength.level ? convStrength.color : '#E0E0E0' },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: convStrength.color }]}>
                    {convStrength.label}
                  </Text>
                </View>
              ) : null}

              <Input
                label="Confirmar contraseña"
                value={convConfirm}
                onChangeText={handleConvChange('confirm', setConvConfirm)}
                secureTextEntry
                error={convErrors.confirm}
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
              />

              <Button
                title={convSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                onPress={handleConvert}
                variant="primary"
                size="large"
                disabled={convSubmitting}
              />
            </View>
          </>
        ) : (
          /* ============================== */
          /* VISTA REGISTRADO               */
          /* ============================== */
          <>
            {/* Estadísticas */}
            {totalPartidas > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>🎮</Text>
                  <Text style={styles.statValue}>{totalPartidas}</Text>
                  <Text style={styles.statLabel}>Partidas</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>⏱️</Text>
                  <Text style={styles.statValue}>{formatTiempo(tiempoTotal)}</Text>
                  <Text style={styles.statLabel}>Jugado</Text>
                </View>
              </View>
            )}

            {/* Sección: Datos personales */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                📝 Datos personales
              </Text>

              {editErrors.general ? (
                <View style={styles.errorBanner} accessibilityRole="alert">
                  <Text style={styles.errorBannerText}>{editErrors.general}</Text>
                </View>
              ) : null}

              {editSuccess ? (
                <View style={styles.successBanner} accessibilityRole="alert">
                  <Text style={styles.successBannerText}>✅ Perfil actualizado correctamente</Text>
                </View>
              ) : null}

              <Input
                label="Nombre completo"
                value={editNombre}
                onChangeText={handleEditChange('nombre', setEditNombre)}
                error={editErrors.nombre}
              />
              <Input
                label="Usuario"
                value={editUsuario}
                onChangeText={handleEditChange('usuario', setEditUsuario)}
                error={editErrors.usuario}
              />

              {hasEditChanges && (
                <View style={styles.editButtons}>
                  <Button
                    title={editSubmitting ? 'Guardando...' : 'Guardar cambios'}
                    onPress={handleSaveProfile}
                    variant="primary"
                    size="large"
                    disabled={editSubmitting}
                  />
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleCancelEdit}
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar cambios en datos personales"
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Sección: Seguridad */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                🔒 Seguridad
              </Text>

              {!showPasswordSection ? (
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPasswordSection(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar contraseña"
                >
                  <Text style={styles.passwordToggleEmoji}>🔑</Text>
                  <View style={styles.passwordToggleContent}>
                    <Text style={styles.passwordToggleText}>Cambiar contraseña</Text>
                    <Text style={styles.passwordToggleHint}>
                      Actualiza tu contraseña de acceso
                    </Text>
                  </View>
                  <Text style={styles.passwordToggleArrow}>›</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.passwordForm}>
                  {pwdErrors.general ? (
                    <View style={styles.errorBanner} accessibilityRole="alert">
                      <Text style={styles.errorBannerText}>{pwdErrors.general}</Text>
                    </View>
                  ) : null}

                  <Input
                    label="Contraseña actual"
                    value={pwdActual}
                    onChangeText={handlePwdChange('actual', setPwdActual)}
                    secureTextEntry
                    error={pwdErrors.actual}
                  />

                  <Input
                    label="Nueva contraseña"
                    value={pwdNueva}
                    onChangeText={handlePwdChange('nueva', setPwdNueva)}
                    secureTextEntry
                    error={pwdErrors.nueva}
                  />

                  {pwdNueva.length > 0 ? (
                    <View style={styles.strengthContainer} accessibilityLabel={`Robustez: ${pwdStrength.label}`}>
                      <View style={styles.strengthBarBg}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <View
                            key={i}
                            style={[
                              styles.strengthSegment,
                              { backgroundColor: i <= pwdStrength.level ? pwdStrength.color : '#E0E0E0' },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.strengthLabel, { color: pwdStrength.color }]}>
                        {pwdStrength.label}
                      </Text>
                    </View>
                  ) : null}

                  <Input
                    label="Confirmar nueva contraseña"
                    value={pwdConfirm}
                    onChangeText={handlePwdChange('confirm', setPwdConfirm)}
                    secureTextEntry
                    error={pwdErrors.confirm}
                    onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
                  />

                  <View style={styles.passwordButtons}>
                    <Button
                      title={pwdSubmitting ? 'Cambiando...' : 'Cambiar contraseña'}
                      onPress={handleChangePassword}
                      variant="primary"
                      size="large"
                      disabled={pwdSubmitting}
                    />
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setShowPasswordSection(false);
                        setPwdActual('');
                        setPwdNueva('');
                        setPwdConfirm('');
                        setPwdErrors({});
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Cancelar cambio de contraseña"
                    >
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </>
        )}
        {/* Cerrar sesión */}
        <View style={styles.logoutSection}>
          <Button
            title="🚪 Cerrar Sesión"
            onPress={handleLogout}
            variant="danger"
            size="large"
          />
        </View>

        {keyboardHeight > 0 && <View style={{ height: keyboardHeight }} />}
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
    paddingBottom: f.s(40),
  },

  // --- Cabecera ---
  header: {
    backgroundColor: colors.primary,
    paddingTop: f.s(54),
    paddingBottom: f.s(28),
    paddingHorizontal: f.s(24),
    alignItems: 'center',
  },
  avatarCircle: {
    width: f.s(80),
    height: f.s(80),
    borderRadius: f.s(40),
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: f.s(12),
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: f.bold,
    color: colors.white,
  },
  headerName: {
    fontSize: f.h2,
    fontWeight: f.bold,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: f.s(18),
    paddingVertical: f.s(7),
    borderRadius: f.s(20),
    marginBottom: f.s(6),
  },
  badgeGuest: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badgeRegistered: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: colors.white,
    fontSize: f.small,
    fontWeight: f.semibold,
  },
  headerDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },

  content: {
    padding: f.s(20),
  },

  // --- Estadísticas ---
  statsRow: {
    flexDirection: 'row',
    gap: f.s(12),
    marginBottom: f.s(20),
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: f.s(16),
    paddingVertical: f.s(18),
    paddingHorizontal: f.s(12),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statEmoji: {
    fontSize: f.s(28),
    marginBottom: f.s(4),
  },
  statValue: {
    fontSize: f.h2,
    fontWeight: f.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: colors.lightText,
    fontWeight: f.semibold,
    marginTop: 2,
  },

  // --- Incentivo (invitados) ---
  incentiveCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: f.s(18),
    padding: f.s(24),
    alignItems: 'center',
    marginBottom: f.s(20),
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
  },
  incentiveEmoji: {
    fontSize: f.s(40),
    marginBottom: f.s(8),
  },
  incentiveTitle: {
    fontSize: f.h2,
    fontWeight: f.bold,
    color: colors.primary,
    marginBottom: 8,
  },
  incentiveText: {
    fontSize: f.body,
    color: colors.lightText,
    textAlign: 'center',
    lineHeight: 28,
  },

  // --- Secciones ---
  section: {
    backgroundColor: colors.white,
    borderRadius: f.s(18),
    padding: f.s(22),
    marginBottom: f.s(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: f.body,
    fontWeight: f.bold,
    color: colors.text,
    marginBottom: f.s(18),
  },

  // --- Banners de error / éxito ---
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: f.s(12),
    padding: f.s(14),
    marginBottom: f.s(16),
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: f.small,
    fontWeight: f.semibold,
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: f.s(12),
    padding: f.s(14),
    marginBottom: f.s(16),
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  successBannerText: {
    color: colors.primary,
    fontSize: f.small,
    fontWeight: f.semibold,
    textAlign: 'center',
  },

  // --- Indicador de robustez ---
  strengthContainer: {
    marginTop: f.s(-12),
    marginBottom: f.s(16),
    paddingHorizontal: 2,
  },
  strengthBarBg: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    borderRadius: 4,
  },
  strengthLabel: {
    fontSize: f.small,
    fontWeight: f.semibold,
  },

  // --- Botón de contraseña (colapsado) ---
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: f.s(14),
    padding: f.s(18),
  },
  passwordToggleEmoji: {
    fontSize: f.s(28),
    marginRight: f.s(14),
  },
  passwordToggleContent: {
    flex: 1,
  },
  passwordToggleText: {
    fontSize: f.body,
    fontWeight: f.semibold,
    color: colors.text,
  },
  passwordToggleHint: {
    fontSize: 14,
    color: colors.lightText,
    marginTop: 2,
  },
  passwordToggleArrow: {
    fontSize: 28,
    color: colors.lightText,
    fontWeight: '300',
  },

  // --- Formulario de contraseña (expandido) ---
  passwordForm: {
    marginTop: 4,
  },
  passwordButtons: {
    marginTop: 4,
  },
  editButtons: {
    marginTop: 4,
  },
  logoutSection: {
    marginTop: f.s(32),
    paddingTop: f.s(24),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: f.s(16),
    marginTop: f.s(4),
  },
  cancelBtnText: {
    fontSize: f.body,
    fontWeight: f.semibold,
    color: colors.lightText,
  },
});
