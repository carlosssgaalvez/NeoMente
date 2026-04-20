import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (usuario, password) => {
    setIsLoading(true);
    try {
      // TODO: Implementar login con API
      console.log('Login:', usuario, password);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (nombre, usuario, password) => {
    setIsLoading(true);
    try {
      // TODO: Implementar registro con API
      console.log('Registro:', nombre, usuario, password);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}