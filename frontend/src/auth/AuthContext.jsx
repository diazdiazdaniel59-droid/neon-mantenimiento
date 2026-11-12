import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setTokenGetter } from '../api/client.js';
import { usuarioDesdeToken } from '../lib/auth.js';

const STORAGE_KEY = 'neon_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(() => usuarioDesdeToken(localStorage.getItem(STORAGE_KEY)));
  const [ready, setReady] = useState(false);

  // El cliente HTTP obtiene el token vigente en cada peticion.
  useEffect(() => {
    setTokenGetter(() => token);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }
    const desdeToken = usuarioDesdeToken(token);
    if (!desdeToken) {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
    } else {
      setUser(desdeToken);
    }
    setReady(true);
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(usuarioDesdeToken(data.token) || data.usuario || null);
    return data;
  }, []);

  const register = useCallback(
    async (nombre, email, password) => {
      await authApi.register(nombre, email, password);
      return login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      login,
      register,
      logout,
      isAdmin: user?.rol === 'admin',
      canManage: user?.rol === 'admin' || user?.rol === 'supervisor',
      isTecnico: user?.rol === 'tecnico',
    }),
    [token, user, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
}
