import React from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      {/* Aquí es donde pondrás tu imagen de manchas cuando la tengas en la carpeta assets */}
      <View style={styles.fondoVerde}>
        <Text style={styles.titulo}>Bienvenido a NeoMente</Text>
        <Text style={styles.subtitulo}>Entrenamiento cognitivo para mayores</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fondoVerde: {
    flex: 1,
    backgroundColor: '#2E7D32', // El verde que elegimos
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 18,
    color: '#E8F5E9',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});