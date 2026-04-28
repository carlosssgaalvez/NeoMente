import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch, Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { colors } from '../constants/colors';
import { useFonts } from '../hooks/useFonts';
import Button from '../components/Button';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { eliminarCuenta } from '../api/authServices';
import { getEstadisticas, borrarEstadisticas } from '../services/dataService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const FONT_OPTIONS = [
  { key: 'normal', label: 'Normal', preview: 20 },
  { key: 'grande', label: 'Grande', preview: 24 },
  { key: 'muy_grande', label: 'Muy grande', preview: 28 },
];

const HOUR_OPTIONS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

/**
 * Solicita permisos de notificación al dispositivo.
 * @returns {boolean} true si se concedieron.
 */
async function requestNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Programa una notificación diaria local.
 * @param {number} hour
 * @param {number} minute
 */
async function scheduleReminder(hour, minute) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧠 ¡Hora de entrenar!',
      body: 'Dedica 10 minutos a tu entrenamiento cognitivo diario con NeoMente.',
      sound: true,
    },
    trigger: {
      type: 'daily',
      hour,
      minute,
    },
  });
}

async function cancelReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Pantalla de ajustes.
 * Secciones: Recordatorio, Tamaño de texto, Información, Gestión de datos, Eliminar cuenta.
 */
export default function SettingsScreen() {
  const { user, isGuest, logout } = useContext(AuthContext);
  const { settings, updateSettings, fontScale } = useContext(SettingsContext);
  const f = useFonts();
  const styles = useMemo(() => getStyles(f), [f]);

  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [reminderHour, setReminderHour] = useState(settings.reminderHour);
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletingStats, setDeletingStats] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setReminderEnabled(settings.reminderEnabled);
    setReminderHour(settings.reminderHour);
  }, [settings]);

  // ================= RECORDATORIO =================
  const handleToggleReminder = useCallback(async (value) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permisos necesarios',
          'Necesitas permitir las notificaciones en los ajustes del dispositivo para activar el recordatorio.',
        );
        return;
      }
      await scheduleReminder(reminderHour, 0);
    } else {
      await cancelReminder();
    }
    setReminderEnabled(value);
    await updateSettings({ reminderEnabled: value });
  }, [reminderHour, updateSettings]);

  const handleChangeHour = useCallback(async (hour) => {
    setReminderHour(hour);
    setShowHourPicker(false);
    await updateSettings({ reminderHour: hour });
    if (reminderEnabled) {
      await scheduleReminder(hour, 0);
    }
  }, [reminderEnabled, updateSettings]);

  // ================= TAMAÑO DE TEXTO =================
  const handleFontScale = useCallback(async (key) => {
    await updateSettings({ fontScale: key });
  }, [updateSettings]);

  // ================= ELIMINAR CUENTA =================
  const handleDeleteAccount = useCallback(() => {
    if (isGuest) {
      Alert.alert('No disponible', 'Las cuentas de invitado no necesitan ser eliminadas.');
      return;
    }
    Alert.alert(
      '⚠️ Eliminar cuenta',
      'Se eliminarán permanentemente tu cuenta y todos tus datos (estadísticas, resultados, progreso). Esta acción NO se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar mi cuenta',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '¿Estás completamente seguro?',
              'Todos tus datos se perderán para siempre.',
              [
                { text: 'No, conservar', style: 'cancel' },
                {
                  text: 'Sí, eliminar',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      await eliminarCuenta();
                      await logout();
                    } catch (err) {
                      Alert.alert('Error', err.response?.data?.detail || 'No se pudo eliminar la cuenta');
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [isGuest, logout]);

  // ================= GESTIÓN DE DATOS =================
  const handleExportData = useCallback(async () => {
    setExporting(true);
    try {
      let data;
      try {
        data = await getEstadisticas();
      } catch (fetchErr) {
        if (fetchErr.response?.status === 404) {
          Alert.alert(
            'Sin datos',
            'Aún no tienes estadísticas para exportar. ¡Juega alguna partida primero!'
          );
          return;
        }
        throw fetchErr;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        Alert.alert(
          'Sin datos',
          'Aún no tienes estadísticas para exportar. ¡Juega alguna partida primero!'
        );
        return;
      }

      const exportObj = {
        usuario: user?.nombre || user?.usuario || 'Invitado',
        tipo_cuenta: isGuest ? 'invitado' : 'registrado',
        fecha_exportacion: new Date().toISOString(),
        estadisticas: data,
      };
      const json = JSON.stringify(exportObj, null, 2);
      const fileName = `neomente_datos_${new Date().toISOString().slice(0, 10)}.json`;
      const file = new File(Paths.cache, fileName);
      file.write(json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar datos de NeoMente',
        });
      } else {
        Alert.alert(
          'No disponible',
          'La función de compartir no está disponible en este dispositivo.'
        );
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || '';
      Alert.alert('Error', `No se pudieron exportar las estadísticas.\n\n${detail}`);
    } finally {
      setExporting(false);
    }
  }, [user, isGuest]);

  const handleDeleteStats = useCallback(() => {
    Alert.alert(
      '🗑️ Borrar estadísticas',
      '¿Estás seguro? Se eliminarán todos tus resultados y progreso en todos los juegos. Tu cuenta se mantendrá.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            setDeletingStats(true);
            try {
              const res = await borrarEstadisticas();
              Alert.alert('Estadísticas borradas', res.mensaje || 'Tus resultados han sido eliminados.');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.detail || 'No se pudieron borrar las estadísticas.');
            } finally {
              setDeletingStats(false);
            }
          },
        },
      ],
    );
  }, []);

  // ================= RENDER =================
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* CABECERA */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>⚙️</Text>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Ajustes
        </Text>
      </View>

      <View style={styles.content}>

        {/* ===== 1. RECORDATORIO ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            🔔 Recordatorio diario
          </Text>
          <Text style={styles.sectionDesc}>
            Recibe una notificación para recordarte tu entrenamiento cognitivo de 10 minutos.
          </Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Activar recordatorio</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: '#E0E0E0', true: colors.lightGreen }}
              thumbColor={reminderEnabled ? colors.primary : '#BDBDBD'}
              accessibilityLabel="Activar recordatorio diario"
            />
          </View>

          {reminderEnabled && (
            <View style={styles.hourSection}>
              <Text style={styles.settingLabel}>Hora del recordatorio</Text>
              <TouchableOpacity
                style={styles.hourButton}
                onPress={() => setShowHourPicker(!showHourPicker)}
                accessibilityRole="button"
                accessibilityLabel={`Hora actual: ${reminderHour}:00. Pulsa para cambiar.`}
              >
                <Text style={styles.hourButtonText}>
                  {`${String(reminderHour).padStart(2, '0')}:00`}
                </Text>
                <Text style={styles.hourArrow}>{showHourPicker ? '▼' : '›'}</Text>
              </TouchableOpacity>

              {showHourPicker && (
                <View style={styles.hourGrid}>
                  {HOUR_OPTIONS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.hourChip, h === reminderHour && styles.hourChipActive]}
                      onPress={() => handleChangeHour(h)}
                      accessibilityRole="button"
                      accessibilityLabel={`${h}:00`}
                    >
                      <Text style={[
                        styles.hourChipText,
                        h === reminderHour && styles.hourChipTextActive,
                      ]}>
                        {`${String(h).padStart(2, '0')}:00`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* ===== 2. TAMAÑO DE TEXTO ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            🔤 Tamaño de texto
          </Text>
          <Text style={styles.sectionDesc}>
            Ajusta el tamaño de la letra en toda la aplicación.
          </Text>

          <View style={styles.fontOptions}>
            {FONT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.fontOption, fontScale === opt.key && styles.fontOptionActive]}
                onPress={() => handleFontScale(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: fontScale === opt.key }}
                accessibilityLabel={`Tamaño ${opt.label}`}
              >
                <Text style={[
                  styles.fontOptionPreview,
                  { fontSize: opt.preview },
                  fontScale === opt.key && styles.fontOptionPreviewActive,
                ]}>
                  Aa
                </Text>
                <Text style={[
                  styles.fontOptionLabel,
                  fontScale === opt.key && styles.fontOptionLabelActive,
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ===== 3. GESTIÓN DE DATOS ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            📊 Gestión de datos
          </Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleExportData}
            disabled={exporting}
            accessibilityRole="button"
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>
                {exporting ? 'Exportando...' : 'Exportar mis datos'}
              </Text>
              <Text style={styles.actionHint}>Genera un resumen de tus estadísticas</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleDeleteStats}
            disabled={deletingStats}
            accessibilityRole="button"
          >
            <Text style={styles.actionEmoji}>🗑️</Text>
            <View style={styles.actionContent}>
              <Text style={[styles.actionText, { color: colors.danger }]}>
                {deletingStats ? 'Borrando...' : 'Borrar mis estadísticas'}
              </Text>
              <Text style={styles.actionHint}>Elimina todo tu progreso y resultados</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ===== 4. INFORMACIÓN ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            ℹ️ Información
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Aplicación</Text>
            <Text style={styles.infoValue}>NeoMente</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plataforma</Text>
            <Text style={styles.infoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
          </View>

          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Acerca de NeoMente</Text>
            <Text style={styles.aboutText}>
              NeoMente es una aplicación de entrenamiento cognitivo diseñada
              especialmente para personas mayores. Ofrece ejercicios de
              memoria, atención y lenguaje con dificultad adaptativa.
            </Text>
            <Text style={styles.aboutCredit}>
              Desarrollada como Trabajo de Fin de Grado (TFG).
            </Text>
          </View>
        </View>

        {/* ===== 5. ELIMINAR CUENTA ===== */}
        {!isGuest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              ⚠️ Zona de peligro
            </Text>

            <TouchableOpacity
              style={styles.deleteRow}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
              accessibilityRole="button"
              accessibilityLabel="Eliminar cuenta permanentemente"
            >
              <Text style={styles.deleteEmoji}>🗑️</Text>
              <View style={styles.actionContent}>
                <Text style={styles.deleteText}>
                  {deletingAccount ? 'Eliminando...' : 'Eliminar mi cuenta'}
                </Text>
                <Text style={styles.deleteHint}>
                  Se borrarán permanentemente todos tus datos
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
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
  header: {
    backgroundColor: colors.primary,
    paddingTop: f.s(50),
    paddingBottom: f.s(30),
    paddingHorizontal: f.s(24),
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: f.s(48),
    marginBottom: f.s(8),
  },
  headerTitle: {
    fontSize: f.h1,
    fontWeight: f.bold,
    color: colors.white,
  },
  content: {
    paddingHorizontal: f.s(20),
    paddingTop: f.s(16),
  },

  // Sections
  section: {
    backgroundColor: colors.white,
    borderRadius: f.s(16),
    padding: f.s(20),
    marginBottom: f.s(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: f.body,
    fontWeight: f.bold,
    color: colors.text,
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: f.small,
    color: colors.lightText,
    lineHeight: 22,
    marginBottom: 16,
  },

  // Reminder
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: f.body,
    color: colors.text,
  },
  hourSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  hourButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: f.s(12),
    padding: f.s(14),
    marginTop: f.s(8),
  },
  hourButtonText: {
    fontSize: f.h2,
    fontWeight: f.bold,
    color: colors.primary,
  },
  hourArrow: {
    fontSize: 24,
    color: colors.lightText,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: f.s(8),
    marginTop: f.s(12),
  },
  hourChip: {
    paddingHorizontal: f.s(14),
    paddingVertical: f.s(10),
    borderRadius: f.s(10),
    backgroundColor: '#F5F5F5',
    minWidth: f.s(70),
    alignItems: 'center',
  },
  hourChipActive: {
    backgroundColor: colors.primary,
  },
  hourChipText: {
    fontSize: f.small,
    fontWeight: f.semibold,
    color: colors.text,
  },
  hourChipTextActive: {
    color: colors.white,
  },

  // Font options
  fontOptions: {
    flexDirection: 'row',
    gap: f.s(12),
  },
  fontOption: {
    flex: 1,
    alignItems: 'center',
    padding: f.s(16),
    borderRadius: f.s(14),
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fontOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  fontOptionPreview: {
    fontWeight: f.bold,
    color: colors.lightText,
    marginBottom: 6,
  },
  fontOptionPreviewActive: {
    color: colors.primary,
  },
  fontOptionLabel: {
    fontSize: 13,
    color: colors.lightText,
    fontWeight: f.semibold,
  },
  fontOptionLabelActive: {
    color: colors.primary,
  },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: f.s(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionEmoji: {
    fontSize: f.s(24),
    marginRight: f.s(12),
  },
  actionContent: {
    flex: 1,
  },
  actionText: {
    fontSize: f.body,
    fontWeight: f.semibold,
    color: colors.text,
  },
  actionHint: {
    fontSize: 13,
    color: colors.lightText,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 24,
    color: colors.lightText,
    marginLeft: 8,
  },

  // Info
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: f.body,
    color: colors.lightText,
  },
  infoValue: {
    fontSize: f.body,
    fontWeight: f.semibold,
    color: colors.text,
  },
  aboutCard: {
    marginTop: f.s(16),
    padding: f.s(16),
    backgroundColor: '#E8F5E9',
    borderRadius: f.s(12),
  },
  aboutTitle: {
    fontSize: f.body,
    fontWeight: f.bold,
    color: colors.primary,
    marginBottom: 8,
  },
  aboutText: {
    fontSize: f.small,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  aboutCredit: {
    fontSize: 13,
    color: colors.lightText,
    fontStyle: 'italic',
  },

  // Delete account
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: f.s(14),
    backgroundColor: '#FFEBEE',
    borderRadius: f.s(12),
    paddingHorizontal: f.s(14),
  },
  deleteEmoji: {
    fontSize: f.s(24),
    marginRight: f.s(12),
  },
  deleteText: {
    fontSize: f.body,
    fontWeight: f.semibold,
    color: colors.danger,
  },
  deleteHint: {
    fontSize: 13,
    color: '#B71C1C',
    marginTop: 2,
  },
});
