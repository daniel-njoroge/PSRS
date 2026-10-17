import { createContext } from 'react';
import type { User } from '../types';

export interface RegistrationPayload {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<User>;
  register: (payload: RegistrationPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isCitizen: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
