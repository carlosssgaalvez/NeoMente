import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import Input from '../components/Input';
import Button from '../components/Button';

export default function LoginScreen({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Login:', { usuario, password });
  };

  const handleGuest = () => {
    console.log('Login como invitado');
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        <Text style={styles.description}>
          Ingresa tus datos para comenzar a entrenar
        </Text>

        <View style={styles.formContainer}>
          <Input
            placeholder="Usuario"
            value={usuario}
            onChangeText={setUsuario}
            keyboardType="default"
          />

          <Input
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Button
          title="Iniciar Sesión"
          onPress={handleLogin}
          variant="primary"
        />

        <Button
          title="Jugar como Invitado"
          onPress={handleGuest}
          variant="secondary"
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('Register')}
          >
            Regístrate aquí
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 30,              // Aumentado
    justifyContent: 'center',
  },
  title: {
    fontSize: fonts.h1,       // 36px
    fontWeight: fonts.bold,
    color: colors.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: fonts.body,     // 20px
    color: colors.lightText,
    textAlign: 'center',
    marginBottom: 40,         // Más espacio
  },
  formContainer: {
    marginBottom: 30,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    flexWrap: 'wrap',
  },
  footerText: {
    color: colors.text,
    fontSize: fonts.body,     // 20px
  },
  link: {
    color: colors.primary,
    fontSize: fonts.body,     // 20px
    fontWeight: fonts.bold,
  },
});