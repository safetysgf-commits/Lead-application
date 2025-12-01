
import React from 'react';
import { User } from './types.ts';

export const AuthContext = React.createContext<{
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);
