import React, { useEffect, useState } from 'react';
import type { User } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';
import { AuthContext } from './authContextValue';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialToken = getStoredToken();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(initialToken);
  const [loading, setLoading] = useState(Boolean(initialToken));

  const fetchCurrentUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; user: User }>('/auth/me');
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setStoredToken(null);
        setToken(null);
        setUser(null);
      }
    } catch {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialToken) return;
    let active = true;
    api.get<{ success: boolean; user: User }>('/auth/me')
      .then((response) => {
        if (active && response.success && response.user) setUser(response.user);
        else if (active) {
          setStoredToken(null);
          setToken(null);
        }
      })
      .catch(() => {
        if (active) {
          setStoredToken(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [initialToken]);

  const login = async (identifier: string, password: string): Promise<User> => {
    const response = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', {
      identifier,
      password
    });
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const register = async (payload: { full_name: string; email: string; phone?: string; password: string }): Promise<User> => {
    const response = await api.post<{ success: boolean; token: string; user: User }>('/auth/register', payload);
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const isCitizen = user?.role === 'citizen';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser: fetchCurrentUser, isCitizen, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
