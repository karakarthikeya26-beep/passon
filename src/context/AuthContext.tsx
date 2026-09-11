'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Gender } from '../types';
import { dbService, initializeDatabase } from '../lib/db';
import { supabase, isSupabaseConfigured, getURL, getNeutralAvatarUrl } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    password?: string,
    branch?: string,
    batch?: string,
    gender?: Gender,
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

  const syncUsers = () => {
    if (typeof window === 'undefined') return;
    initializeDatabase();
    const storedUsers = dbService.getUsers();
    setUsers(storedUsers);

    const currentId = dbService.getCurrentUserId();
    const user = storedUsers.find((u) => u.id === currentId) || storedUsers[0] || null;
    setCurrentUser(user);
  };

  useEffect(() => {
    syncUsers();
    setIsLoading(false);

    const handleDbChange = () => {
      const storedUsers = dbService.getUsers();
      setUsers(storedUsers);
      const currentId = dbService.getCurrentUserId();
      const user = storedUsers.find((u) => u.id === currentId) || null;
      setCurrentUser(user);
    };

    window.addEventListener('passon_db_change', handleDbChange);

    let subscription: any = null;
    if (isSupabaseConfigured) {
      const authListener = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
        if (session?.user) {
          const userEmail = session.user.email?.toLowerCase();
          const storedUsers = dbService.getUsers();
          const matched = storedUsers.find((u) => u.email.toLowerCase() === userEmail);
          if (matched) {
            setCurrentUser(matched);
            dbService.setCurrentUserId(matched.id);
          } else {
            const newUser: User = {
              id: session.user.id,
              name: session.user.user_metadata?.name || userEmail?.split('@')[0] || 'VNR Student',
              email: userEmail || '',
              branch: session.user.user_metadata?.branch || 'Computer Science & Engineering',
              batch: session.user.user_metadata?.batch || '2nd Year (2024-2028)',
              gender: session.user.user_metadata?.gender || 'Prefer not to say',
              avatar_url: getNeutralAvatarUrl(session.user.user_metadata?.name),
              role: 'student',
              created_at: new Date().toISOString(),
            };
            const updated = [newUser, ...storedUsers];
            localStorage.setItem('passon_users', JSON.stringify(updated));
            setCurrentUser(newUser);
            dbService.setCurrentUserId(newUser.id);
            setUsers(updated);
          }
        }
      });
      subscription = authListener?.data?.subscription;
    }

    return () => {
      window.removeEventListener('passon_db_change', handleDbChange);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    initializeDatabase();

    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (!error && data?.user) {
          console.log('Supabase authenticated user:', data.user.email);
        }
      } catch (err) {
        console.warn('Supabase signInWithPassword note:', err);
      }
    }

    const allUsers = dbService.getUsers();
    const foundUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (foundUser) {
      setCurrentUser(foundUser);
      dbService.setCurrentUserId(foundUser.id);
      setUsers(allUsers);
      return true;
    }

    return false;
  };

  const signup = async (
    name: string,
    email: string,
    password?: string,
    branch?: string,
    batch?: string,
    gender?: Gender,
    bio?: string
  ): Promise<User | null> => {
    initializeDatabase();
    const allUsers = dbService.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    const redirectUrl = `${getURL()}auth/callback`;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password || 'PassOn2026!',
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: name.trim(),
              branch: branch || 'Computer Science & Engineering',
              batch: batch || '2nd Year (2024-2028)',
              gender: gender || 'Prefer not to say',
            },
          },
        });
        if (error) {
          console.error('Supabase signUp error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase auth signup note:', err);
      }
    }

    const existingUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        name: name.trim() || existingUser.name,
        branch: branch || existingUser.branch,
        batch: batch || existingUser.batch,
        gender: gender || existingUser.gender || 'Prefer not to say',
        bio: bio?.trim() || existingUser.bio || '',
      };
      dbService.updateProfile(existingUser.id, updatedUser);
      setCurrentUser(updatedUser);
      dbService.setCurrentUserId(existingUser.id);
      setUsers(dbService.getUsers());
      return updatedUser;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      branch: branch || 'Computer Science & Engineering',
      batch: batch || '2nd Year (2024-2028)',
      gender: gender || 'Prefer not to say',
      bio: bio?.trim() || '',
      avatar_url: getNeutralAvatarUrl(name),
      role: 'student',
      created_at: new Date().toISOString(),
    };

    const updatedUsers = [newUser, ...allUsers];
    if (typeof window !== 'undefined') {
      localStorage.setItem('passon_users', JSON.stringify(updatedUsers));
      window.dispatchEvent(new Event('passon_db_change'));
    }

    setCurrentUser(newUser);
    dbService.setCurrentUserId(newUser.id);
    setUsers(updatedUsers);

    return newUser;
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('passon_current_user_id');
      window.dispatchEvent(new Event('passon_db_change'));
    }
  };

  const switchDemoUser = (userId: string) => {
    const allUsers = dbService.getUsers();
    const target = allUsers.find((u) => u.id === userId) || null;
    if (target) {
      setCurrentUser(target);
      dbService.setCurrentUserId(target.id);
    }
  };

  const updateProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = dbService.updateProfile(currentUser.id, data);
    setCurrentUser(updated);
    setUsers(dbService.getUsers());
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