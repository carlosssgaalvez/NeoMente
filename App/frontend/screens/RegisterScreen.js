import React, { useState, useContext, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Keyboard, Platform } from 'react-native';
import { colors } from '../constants/colors';
import { useFonts } from '../hooks/useFonts';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import { isValidPassword, isValidUsername } from '../utils/validation';

/**
 * Calcula el nivel de robustez de una contraseña (0–4).
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

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { register, setError } = useContext(AuthContext);
  const scrollRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const f = useFonts();
  const styles = useMemo(() => getStyles(f), [f]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e) => setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);
    const sub1 = Keyboard.addListener(showEvent, onShow);
    const sub2 = Keyboard.addListener(hideEvent, onHide);
    return () => { sub1.remove(); sub2.remove(); };
  }, []);

  // Indicador de robustez en tiempo real
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  /**
   * Limpia el error de un campo cuando el usuario edita ese campo.
   */
  const handleChange = (field, setter) => (value) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleRegister = async () => {
    const errors = {};

    if (!nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    }

    if (!usuario.trim()) {
      errors.usuario = 'El usuario es obligatorio';
    } else if (!isValidUsername(usuario.trim())) {
      errors.usuario = 'El usuario debe tener entre 3 y 50 caracteres';
    }

    if (!password) {
      errors.password = 'La contraseña es obligatoria';
    } else {
      const passwordCheck = isValidPassword(password);
      if (!passwordCheck.valid) {
        errors.password = passwordCheck.message;
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña';
    } else if (password && password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (Object.keys(errors).length > 0) {
      if (errors.password || errors.confirmPassword) {
        setConfirmPassword('');
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      setError(null);
      await register(nombre.trim(), usuario.trim(), password);
      // RootNavigator detecta el cambio de auth y navega automáticamente
    } catch (err) {
      // Detectar error del backend por usuario duplicado
      const msg = err.message || '';
      if (msg.toLowerCase().includes('usuario') || msg.toLowerCase().includes('existe') || msg.toLowerCase().includes('registrado')) {
        setFieldErrors({ usuario: msg });
      } else {
        setFieldErrors({ general: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">Crear Cuenta</Text>

        {fieldErrors.general ? (
          <View style={styles.generalError} accessibilityRole="alert">
            <Text style={styles.generalErrorText}>{fieldErrors.general}</Text>
          </View>
        ) : null}

        <Input
          label="Nombre completo"
          value={nombre}
          onChangeText={handleChange('nombre', setNombre)}
          error={fieldErrors.nombre}
        />

        <Input
          label="Usuario"
          value={usuario}
          onChangeText={handleChange('usuario', setUsuario)}
          error={fieldErrors.usuario}
        />

        <Input
          label="Contraseña"
          value={password}
          onChangeText={handleChange('password', setPassword)}
          secureTextEntry
          error={fieldErrors.password}
        />

        {/* Indicador de robustez */}
        {password.length > 0 ? (
          <View style={styles.strengthContainer} accessibilityLabel={`Robustez: ${strength.label}`}>
            <View style={styles.strengthBarBg}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.strengthSegment,
                    {
                      backgroundColor: i <= strength.level ? strength.color : '#E0E0E0',
                      marginRight: i < 5 ? 4 : 0,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>
              {strength.label}
            </Text>
          </View>
        ) : null}

        <Input
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={handleChange('confirmPassword', setConfirmPassword)}
          secureTextEntry
          error={fieldErrors.confirmPassword}
          onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
        />

        <Button
          title={submitting ? "Registrando..." : "Registrarse"}
          onPress={handleRegister}
          variant="primary"
          size="large"
          disabled={submitting}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="link"
          >
            Inicia sesión
          </Text>
        </View>

        <View style={styles.footer}>
          <Text
            style={styles.link}
            onPress={() => navigation.goBack()}
            accessibilityRole="link"
          >
            Volver
          </Text>
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
  },
  content: {
    flex: 1,
    padding: f.s(30),
    justifyContent: 'center',
  },
  title: {
    fontSize: f.h2,
    fontWeight: f.bold,
    color: colors.primary,
    marginBottom: f.s(30),
    textAlign: 'center',
  },
  generalError: {
    backgroundColor: '#FFEBEE',
    borderRadius: f.s(10),
    padding: f.s(14),
    marginBottom: f.s(18),
    borderWidth: 1,
    borderColor: colors.danger,
  },
  generalErrorText: {
    color: colors.danger,
    fontSize: f.small,
    fontWeight: f.semibold,
    textAlign: 'center',
  },
  // — Indicador de robustez —
  strengthContainer: {
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  strengthBarBg: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  strengthSegment: {
    flex: 1,
    borderRadius: 4,
  },
  strengthLabel: {
    fontSize: f.small,
    fontWeight: f.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: f.s(20),
  },
  footerText: {
    color: colors.text,
    fontSize: f.body,
  },
  link: {
    color: colors.primary,
    fontSize: f.body,
    fontWeight: f.bold,
  },
});
