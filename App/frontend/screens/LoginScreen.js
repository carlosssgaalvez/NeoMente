import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Keyboard, Platform } from 'react-native';
import { colors } from '../constants/colors';
import { useFonts } from '../hooks/useFonts';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { login, setError } = useContext(AuthContext);
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

  const handleLogin = async () => {
    const errors = {};

    if (!usuario.trim()) {
      errors.usuario = 'Introduce tu usuario';
    }
    if (!password) {
      errors.password = 'Introduce tu contraseña';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      setError(null);
      await login(usuario.trim(), password);
      // RootNavigator detecta el cambio de auth y navega automáticamente
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('usuario') || msg.toLowerCase().includes('contraseña') || msg.toLowerCase().includes('incorrectos')) {
        setFieldErrors({ general: msg });
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
        <Text style={styles.title}>Iniciar Sesión</Text>
        <Text style={styles.description}>
          Ingresa tus datos para comenzar a entrenar
        </Text>

        {fieldErrors.general ? (
          <View style={styles.generalError} accessibilityRole="alert">
            <Text style={styles.generalErrorText}>{fieldErrors.general}</Text>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <Input
            label="Usuario"
            value={usuario}
            onChangeText={handleChange('usuario', setUsuario)}
            keyboardType="default"
            error={fieldErrors.usuario}
          />

          <Input
            label="Contraseña"
            value={password}
            onChangeText={handleChange('password', setPassword)}
            secureTextEntry
            error={fieldErrors.password}
          />
        </View>

        <Button
          title={submitting ? "Iniciando..." : "Iniciar Sesión"}
          onPress={handleLogin}
          variant="primary"
          size="large"
          disabled={submitting}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('Register')}
            accessibilityRole="link"
          >
            Regístrate aquí
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
    fontSize: f.h1,
    fontWeight: f.bold,
    color: colors.primary,
    marginBottom: f.s(15),
    textAlign: 'center',
  },
  description: {
    fontSize: f.body,
    color: colors.lightText,
    textAlign: 'center',
    marginBottom: f.s(40),
  },
  formContainer: {
    marginBottom: f.s(30),
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: f.s(30),
    flexWrap: 'wrap',
  },
  footerText: {
    color: colors.text,
    fontSize: f.body,     // 20px
  },
  link: {
    color: colors.primary,
    fontSize: f.body,     // 20px
    fontWeight: f.bold,
  },
});
