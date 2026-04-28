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

const MAX_COMBINED_SCALE = 1.6;

const DEFAULT_SETTINGS = {
  fontScale: 'normal',
  reminderEnabled: false,
  reminderHour: 10,
  reminderMinute: 0,
};

/**
 * Proveedor de ajustes de la aplicación.
 * Persiste las preferencias del usuario en SecureStore.
 * Expone las fuentes escaladas (combinando escala de app + sistema) y
 * una función de escalado dimensional para UI responsiva.
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
  const systemScale = getSystemFontScale();
  const combinedScale = Math.min(appScale * systemScale, MAX_COMBINED_SCALE);

  const scaledFonts = useMemo(() => ({
    h1: Math.round(baseFonts.h1 * combinedScale),
    h2: Math.round(baseFonts.h2 * combinedScale),
    body: Math.round(baseFonts.body * combinedScale),
    small: Math.round(baseFonts.small * combinedScale),
    bold: baseFonts.bold,
    semibold: baseFonts.semibold,
    normal: baseFonts.normal,
    s: dimensionScale,
  }), [combinedScale]);

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
