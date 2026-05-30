// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const CURRENT_USER_KEY = 'barber_current_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intentamos cargar desde cualquiera de las dos llaves guardadas en localStorage
    const storedUser = localStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem('usuario');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  };

  const login = async (email, password, selectedRole) => {
    try {
      const response = await fetchWithTimeout(
        'http://localhost:5000/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            userType: selectedRole
          })
        },
        10000
      );

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('El servidor respondió con formato no válido.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Error en las credenciales');
      }

      const userData = {
        id: data.user.id,
        name: data.user.name || data.user.nombre,
        email: data.user.email || data.user.correo,
        phone: data.user.phone || data.user.telefono,
        rol: data.user.rol,
        role: data.user.rol
      };

      setUser(userData);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      localStorage.setItem('usuario', JSON.stringify(userData));

      return userData;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('El servidor tardó demasiado. Intenta de nuevo en unos segundos.');
      }
      if (error.message === 'Failed to fetch' || error.message === 'fetch failed') {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
      }
      throw error;
    }
  };

  const signup = async (nombre, correo, telefono, password, rol) => {
    try {
      const response = await fetchWithTimeout(
        'http://localhost:5000/signup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nombre, correo, telefono, password, rol }),
        },
        10000
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el registro');
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('El servidor tardó demasiado. Intenta de nuevo en unos segundos.');
      }
      console.error('Error en AuthContext Signup:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('usuario');
  };

  const updateProfile = (profile) => {
    const updatedUser = { ...user, ...profile };
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    localStorage.setItem('usuario', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};