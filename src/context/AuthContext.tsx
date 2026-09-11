'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { dbService, initializeDatabase } from '../lib/db';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string) => boolean;
  signup: (name: string, email: string, branch: string, batch: string, bio?: string) => User;
  logout: () => void;
  switchDemoUser: (userId: string) => void;
  updateProfile: (data: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadAuth = () => {
    initializeDatabase();
    const allUsers = dbService.getUsers();
    setUsers(allUsers);
    const currentId = dbService.getCurrentUserId();
    const user = allUsers.find((u) => u.id === currentId) || allUsers[0] || null;
    setCurrentUser(user);
    setIsLoading(false);
  };

  useEffect(() => {
    reloadAuth();

    const handleDbChange = () => {
      const allUsers = dbService.getUsers();
      setUsers(allUsers);
      const currentId = dbService.getCurrentUserId();
      const user = allUsers.find((u) => u.id === currentId) || null;
      setCurrentUser(user);
    };

    window.addEventListener('passon_db_change', handleDbChange);
    return () => window.removeEventListener('passon_db_change', handleDbChange);
  }, []);

  const login = (email: string): boolean => {
    const allUsers = dbService.getUsers();
    const user = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      dbService.setCurrentUserId(user.id);
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, branch: string, batch: string, bio?: string): User => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      branch,
      batch,
      bio,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      role: 'student',
      created_at: new Date().toISOString(),
    };
    const currentUsers = dbService.getUsers();
    const updated = [newUser, ...currentUsers];
    if (typeof window !== 'undefined') {
      localStorage.setItem('passon_users', JSON.stringify(updated));
    }
    dbService.setCurrentUserId(newUser.id);
    setCurrentUser(newUser);
    setUsers(updated);
    return newUser;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('passon_current_user_id');
    }
    setCurrentUser(null);
  };

  const switchDemoUser = (userId: string) => {
    dbService.setCurrentUserId(userId);
    const allUsers = dbService.getUsers();
    const target = allUsers.find((u) => u.id === userId) || null;
    setCurrentUser(target);
  };

  const updateProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = dbService.updateProfile(currentUser.id, data);
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        signup,
        logout,
        switchDemoUser,
        updateProfile,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
