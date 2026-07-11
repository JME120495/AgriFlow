import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // Déconnexion automatique après inactivité (15 minutes)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let inactivityTimer;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes en millisecondes

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.log('[SYS] Déconnexion automatique pour inactivité.');
        logout();
      }, INACTIVITY_LIMIT);
    };

    // Écouter les interactions de l'utilisateur
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach((event) => document.addEventListener(event, resetInactivityTimer));

    resetInactivityTimer();
    setLoading(false);

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach((event) => document.removeEventListener(event, resetInactivityTimer));
    };
  }, [user]);

  const login = async (identifier, password) => {
    try {
      const response = await api.post('/auth/login', { identifier, password });
      const { access_token, refresh_token, user: userData } = response.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Une erreur est survenue lors de la connexion.';
      return { success: false, message: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Erreur lors du logout backend', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const forgotPassword = async (identifier) => {
    try {
      await api.post('/auth/forgot-password', { identifier });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Erreur.' };
    }
  };

  const resetPassword = async (identifier, code, new_password) => {
    try {
      await api.post('/auth/reset-password', { identifier, code, new_password });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Erreur.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
