import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import Button from '../components/Button';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Bienvenido a NeoMente</Text>
        <Text style={styles.subtitle}>
          Entrena tu mente jugando de forma divertida
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Elige un juego:</Text>

        <Button
          title="🔤 Sopa de Letras"
          onPress={() => console.log('Sopa de Letras')}
          variant="primary"
        />

        <Button
          title="🧠 Memoria de Caras"
          onPress={() => console.log('Memoria de Caras')}
          variant="primary"
        />

        <View style={styles.divider} />

        <Button
          title="📊 Mis Estadísticas"
          onPress={() => console.log('Estadísticas')}
          variant="secondary"
        />

        <Button
          title="🚪 Cerrar Sesión"
          onPress={() => navigation.replace('Auth')}
          variant="danger"
        />
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
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  welcome: {
    fontSize: fonts.h1,       // 36px
    fontWeight: fonts.bold,
    color: colors.white,
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.body,     // 20px
    color: colors.lightGreen,
    textAlign: 'center',
  },
  content: {
    padding: 30,              // Más espacio
  },
  sectionTitle: {
    fontSize: fonts.h2,       // 28px
    fontWeight: fonts.bold,
    color: colors.primary,
    marginBottom: 25,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
});