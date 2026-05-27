// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const USERS_STORAGE_KEY = 'barber_users';
const CURRENT_USER_KEY = 'barber_current_user';

// Cargar usuarios desde localStorage
const loadUsers = () => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  // Usuario barbero por defecto
  return [{
    id: 'barbero1',
    name: 'Barbero Editorial',
    email: 'barbero@editorial.com',
    password: 'barbero123',
    phone: '+52 55 1234 5678',
    role: 'barbero'
  }];
};

const saveUsers = (users) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurar sesión guardada
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, selectedRole) => {
    const users = loadUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (!foundUser) {
      throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
    }
    
    // Usar el rol guardado en la cuenta, sin validación adicional
    // Exito - guardar usuario (sin password)
    const { password: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  };

  const signup = async (name, email, phone, password, role = 'cliente') => {
    const users = loadUsers();
    
    // Validar si el email ya existe
    if (users.some(u => u.email === email)) {
      throw new Error('El correo electrónico ya está registrado. Inicia sesión o usa otro correo.');
    }
    
    // Crear nuevo usuario con rol seleccionado
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      phone,
      role: role === 'barbero' ? 'barbero' : 'cliente'
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // No iniciar sesión automáticamente, solo crear cuenta
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const value = {
    user,
    login,
    signup,
    logout,
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