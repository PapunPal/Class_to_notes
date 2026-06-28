import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setAccessToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login state on load (silent refresh)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const res = await api.post('/auth/refresh-token');
        const { accessToken } = res.data;
        setAccessToken(accessToken);
        
        // Fetch profile
        const profileRes = await api.get('/users/profile');
        setUser(profileRes.data.user);
      } catch (err) {
        console.log('No active session found.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up global hook for API authorization failure (unauthenticated)
    window.handleAuthFailure = () => {
      setUser(null);
      setAccessToken('');
    };

    return () => {
      window.handleAuthFailure = null;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: loggedUser } = res.data;
      setAccessToken(accessToken);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      throw err.response?.data?.message || 'Invalid email or password';
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { accessToken, user: registeredUser } = res.data;
      setAccessToken(accessToken);
      setUser(registeredUser);
      return registeredUser;
    } catch (err) {
      throw err.response?.data?.message || 'Registration failed';
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error on backend:', err);
    } finally {
      setAccessToken('');
      setUser(null);
    }
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.patch('/users/profile', data);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to update profile';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
