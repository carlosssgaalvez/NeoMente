import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { saveSettings, getSettings } from '../utils/storage';
import { fonts as baseFonts } from '../constants/fonts';
import { getSystemFontScale, scale as dimensionScale } from '../utils/responsive';

export const SettingsContext = createContext();

const FONT_SCALES = {
  normal: 1,
  grande: 1.2,
  muy_grande: 1.4,
};

const DEFAULT_SETTINGS = {
  fontScale: 'normal',
  reminderEnabled: false,
  reminderHour: 10,
  reminderMinute: 0,
};

/**
 * Proveedor de ajustes de la aplicación.
 * Persiste las preferencias del usuario en SecureStore.
 * La escala de fuente del sistema operativo se ignora por completo;
 * el tamaño de texto se controla únicamente desde los ajustes de NeoMente.
 */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const saved = await getSettings();
      if (saved) setSettings((prev) => ({ ...prev, ...saved }));
      setLoaded(true);
    };
    load();
  }, []);

  const updateSettings = useCallback(async (partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const appScale = FONT_SCALES[settings.fontScale] || 1;

  // Contrarresta la escala del SO: si el sistema aplica ×1.3 y nosotros
  // dividimos por 1.3, el resultado final es el tamaño que queremos.
  // Combinado con allowFontScaling=false esto garantiza inmunidad total.
  const systemScale = getSystemFontScale();
  const correction = 1 / systemScale;
  const effectiveScale = appScale * correction;

  const scaledFonts = useMemo(() => ({
    h1: Math.round(baseFonts.h1 * effectiveScale),
    h2: Math.round(baseFonts.h2 * effectiveScale),
    body: Math.round(baseFonts.body * effectiveScale),
    small: Math.round(baseFonts.small * effectiveScale),
    bold: baseFonts.bold,
    semibold: baseFonts.semibold,
    normal: baseFonts.normal,
    s: dimensionScale,
  }), [effectiveScale]);

  const value = useMemo(() => ({
    settings,
    updateSettings,
    scaledFonts,
    fontScale: settings.fontScale,
    loaded,
  }), [settings, updateSettings, scaledFonts, loaded]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
