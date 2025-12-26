import { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '../utils/apiConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay sesión guardada al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    // Deferir las actualizaciones de estado para evitar setState síncrono en el efecto
    Promise.resolve().then(() => {
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
      setLoading(false);
    });
  }, []);

  // Sistema de cierre de sesión por inactividad (10 minutos)
  useEffect(() => {
    if (!user) return; // Solo activo si hay sesión iniciada

    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos en milisegundos
    let inactivityTimer;

    const resetTimer = () => {
      // Limpiar el temporizador anterior
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      // Crear nuevo temporizador
      inactivityTimer = setTimeout(() => {
        // Cerrar sesión por inactividad
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Opcional: mostrar mensaje al usuario
        console.log('Sesión cerrada por inactividad');
      }, INACTIVITY_TIMEOUT);
    };

    // Eventos que indican actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Agregar listeners para todos los eventos
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Iniciar el temporizador
    resetTimer();

    // Cleanup: remover listeners y limpiar temporizador
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [user]);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Usuario o contraseña incorrectos' };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'No se pudo conectar con el servidor' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const isAuthenticated = () => {
    return user !== null && token !== null;
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
