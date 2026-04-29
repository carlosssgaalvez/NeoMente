import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as authAPI from '../api/authServices';
import {
  saveTokens, saveUser, getAccessToken, getUser, clearAll,
  saveGuestData, getGuestId, getGuestRefreshToken, clearGuestData,
} from '../utils/storage';
import { initDatabase, saveUsuarioLocal, getUsuarioLocal, clearAllLocalData } from '../database/localDB';
import { isOnline, fullSync, startAutoSync, stopAutoSync } from '../services/syncService';

export const AuthContext = createContext();

/**
 * Proveedor de autenticación que gestiona toda la lógica de sesión:
 * - Restaurar sesión al abrir la app (online u offline)
 * - Invitado: creación 100% local, sin servidor
 * - Login / Register / Logout con sincronización
 * - Conversión invitado → registrado con subida de datos locales
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Restaura la sesión al iniciar la app.
   * Primero intenta online (backend), si falla usa datos locales.
   */
  const restoreSession = useCallback(async () => {
    try {
      await initDatabase();

      const token = await getAccessToken();
      if (token) {
        const online = await isOnline();
        if (online) {
          try {
            const perfil = await authAPI.getPerfil();
            await saveUser(perfil);
            await saveUsuarioLocal(perfil);
            setUser(perfil);
            startAutoSync();
            return;
          } catch {
            // Token inválido online — intentar local
          }
        }

        // Offline o token inválido — restaurar desde local
        const localUser = await getUsuarioLocal();
        if (localUser) {
          setUser(localUser);
          if (!localUser.es_invitado) startAutoSync();
          return;
        }

        // Nada válido — limpiar
        await clearAll();
        await clearGuestData();
      } else {
        // Sin token — verificar si hay invitado local
        const localUser = await getUsuarioLocal();
        if (localUser && localUser.es_invitado) {
          setUser(localUser);
          return;
        }
        await clearAll();
        await clearGuestData();
      }
    } catch {
      await clearAll();
      await clearGuestData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /**
   * Crea un perfil invitado 100% local (sin servidor).
   * Si ya existía un invitado local, lo reutiliza.
   */
  const loginAsGuest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await initDatabase();

      // Intentar restaurar invitado local existente
      const localUser = await getUsuarioLocal();
      if (localUser && localUser.es_invitado) {
        setUser(localUser);
        return;
      }

      // Crear nuevo invitado localmente
      const guestProfile = {
        id: null,
        nombre: 'Invitado',
        usuario: null,
        es_invitado: true,
        fecha_registro: new Date().toISOString(),
      };

      await saveUsuarioLocal(guestProfile);
      await saveUser(guestProfile);
      setUser(guestProfile);
    } catch (err) {
      const message = err.message || 'Error al crear perfil invitado';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Inicia sesión con usuario y contraseña (requiere internet).
   * Si existía un invitado local, sus datos se conservan para sincronizar.
   */
  const login = async (usuario, password) => {
    setError(null);
    try {
      const online = await isOnline();
      if (!online) {
        throw new Error('Necesitas conexión a internet para iniciar sesión');
      }

      const tokenData = await authAPI.login(usuario, password);
      await saveTokens(tokenData.access_token, tokenData.refresh_token);

      await clearGuestData();

      const perfil = await authAPI.getPerfil();
      await saveUser(perfil);
      await saveUsuarioLocal(perfil);
      setUser(perfil);

      startAutoSync();
      fullSync();
    } catch (err) {
      const raw = err.response?.data?.detail;
      const message = Array.isArray(raw)
        ? raw.map((e) => e.msg || e.message || JSON.stringify(e)).join('. ')
        : raw || err.message || 'Error al iniciar sesión';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Registra un nuevo usuario (requiere internet).
   * Si había un invitado local, los datos se conservan y se sincronizan.
   */
  const register = async (nombre, usuario, password) => {
    setError(null);
    try {
      const online = await isOnline();
      if (!online) {
        throw new Error('Necesitas conexión a internet para registrarte');
      }

      await authAPI.registro(nombre, usuario, password);
      const tokenData = await authAPI.login(usuario, password);
      await saveTokens(tokenData.access_token, tokenData.refresh_token);
      await clearGuestData();

      const perfil = await authAPI.getPerfil();
      await saveUser(perfil);
      await saveUsuarioLocal(perfil);
      setUser(perfil);

      startAutoSync();
      fullSync();
    } catch (err) {
      const raw = err.response?.data?.detail;
      const message = Array.isArray(raw)
        ? raw.map((e) => e.msg || e.message || JSON.stringify(e)).join('. ')
        : raw || err.message || 'Error al registrarse';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Convierte la cuenta invitada actual en registrada (requiere internet).
   * Los datos locales se sincronizan automáticamente tras la conversión.
   */
  const convertGuest = async (nombre, usuario, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const online = await isOnline();
      if (!online) {
        throw new Error('Necesitas conexión a internet para crear tu cuenta');
      }

      await authAPI.registro(nombre, usuario, password);
      const tokenData = await authAPI.login(usuario, password);
      await saveTokens(tokenData.access_token, tokenData.refresh_token);
      await clearGuestData();

      const perfil = await authAPI.getPerfil();
      await saveUser(perfil);
      await saveUsuarioLocal(perfil);
      setUser(perfil);

      startAutoSync();
      await fullSync();
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Error al crear cuenta';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cierra sesión — limpia tokens y datos locales del invitado.
   * Si era registrado, para la sincronización automática.
   */
  const logout = async () => {
    stopAutoSync();
    await clearAll();
    await clearAllLocalData();
    await import('../database/localDB').then((db) => db.clearUsuarioLocal());
    setUser(null);
    setError(null);
  };

  /**
   * Refresca los datos del usuario desde el backend (si hay conexión).
   */
  const refreshUser = async () => {
    try {
      const online = await isOnline();
      if (!online) return;

      const perfil = await authAPI.getPerfil();
      await saveUser(perfil);
      await saveUsuarioLocal(perfil);
      setUser(perfil);
    } catch {
      // Silencioso — no romper la app si falla el refresco
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isAuthenticated: !!user,
        isGuest: user?.es_invitado ?? false,
        login,
        register,
        loginAsGuest,
        convertGuest,
        logout,
        restoreSession,
        refreshUser,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
