'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { dbService, initializeDatabase } from '../lib/db';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    password: string,
    branch: string,
    batch: string,
    bio?: string
  ) => Promise<User | null>;
  logout: () => Promise<void>;
  switchDemoUser: (userId: string) => void;
  updateProfile: (data: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Could not load user profile:', error);
      return null;
    }

    return data as User;
  };

  useEffect(() => {
    initializeDatabase();

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await loadProfile(session.user.id);

        if (profile) {
          setCurrentUser(profile);
          setUsers([profile]);
        }
      }

      setIsLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);

        if (profile) {
          setCurrentUser(profile);
          setUsers([profile]);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error('Login error:', error);
      return false;
    }

    const profile = await loadProfile(data.user.id);

    if (!profile) {
      await supabase.auth.signOut();
      return false;
    }

    setCurrentUser(profile);
    setUsers([profile]);

    return true;
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    branch: string,
    batch: string,
    bio?: string
  ): Promise<User | null> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      console.error('Signup error:', error);
      return null;
    }

    const newUser: User = {
      id: data.user.id,
      name,
      email,
      branch,
      batch,
      bio,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      role: 'student',
      created_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('users')
      .insert(newUser);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return null;
    }

    setCurrentUser(newUser);
    setUsers([newUser]);

    return newUser;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUsers([]);
  };

  const switchDemoUser = (userId: string) => {
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