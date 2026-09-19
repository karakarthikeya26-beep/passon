'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Gender } from '../types';
import { dbService, initializeDatabase } from '../lib/db';
import { supabase, isSupabaseConfigured, getURL, getNeutralAvatarUrl } from '../lib/supabase';

export interface SignupResult {
  success: boolean;
  user?: User | null;
  requiresVerification?: boolean;
  message?: string;
  error?: string;
  isAlreadyRegistered?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: User | null;
  error?: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password?: string) => Promise<LoginResult>;
  signup: (
    name: string,
    email: string,
    password?: string,
    branch?: string,
    batch?: string,
    gender?: Gender,
    bio?: string
  ) => Promise<SignupResult>;
  resetPasswordForEmail: (email: string) => Promise<ResetPasswordResult>;
  updatePassword: (newPassword: string) => Promise<ResetPasswordResult>;
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
    const user = currentId ? (storedUsers.find((u) => u.id === currentId) || null) : null;
    setCurrentUser(user);
  };

  useEffect(() => {
    syncUsers();
    setIsLoading(false);

    const handleDbChange = () => {
      const storedUsers = dbService.getUsers();
      setUsers(storedUsers);
      const currentId = dbService.getCurrentUserId();
      const user = currentId ? (storedUsers.find((u) => u.id === currentId) || null) : null;
      setCurrentUser(user);
    };

    window.addEventListener('passon_db_change', handleDbChange);

    let subscription: any = null;
    if (isSupabaseConfigured) {
      const authListener = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
        console.log('[AuthContext] Auth state changed:', _event, session?.user?.email);
        if (_event === 'SIGNED_OUT') {
          setCurrentUser(null);
          dbService.setCurrentUserId('');
          return;
        }

        if (session?.user) {
          const userEmail = session.user.email?.toLowerCase();
          const storedUsers = dbService.getUsers();
          const matched = storedUsers.find((u) => u.email.toLowerCase() === userEmail);
          if (matched) {
            if (matched.id !== session.user.id) {
              matched.id = session.user.id;
              if (typeof window !== 'undefined') {
                localStorage.setItem('passon_users', JSON.stringify(storedUsers));
              }
            }
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
              bio: session.user.user_metadata?.bio || '',
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

  const login = async (email: string, password?: string): Promise<LoginResult> => {
    initializeDatabase();

    const cleanEmail = email.trim().toLowerCase();
    console.log('[AuthContext] Attempting login for:', cleanEmail);

    if (isSupabaseConfigured && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          console.error('[AuthContext] Supabase signIn error:', error.message);
          const errMsg = error.message.toLowerCase();
          if (errMsg.includes('email not confirmed')) {
            return {
              success: false,
              error: 'Email not verified yet. Please check your inbox and click the verification link.',
            };
          }
          if (errMsg.includes('invalid login credentials')) {
            return {
              success: false,
              error: 'Invalid email or password. Please check your credentials and try again.',
            };
          }
          return { success: false, error: error.message };
        }

        // ✅ Supabase confirmed the session — find or build the local profile.
        if (data?.user) {
          console.log('[AuthContext] Supabase authenticated user:', data.user.email);
          const allUsers = dbService.getUsers();
          const existingUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

          if (existingUser) {
            if (existingUser.id !== data.user.id) {
              existingUser.id = data.user.id;
              if (typeof window !== 'undefined') {
                localStorage.setItem('passon_users', JSON.stringify(allUsers));
              }
            }
            setCurrentUser(existingUser);
            dbService.setCurrentUserId(existingUser.id);
            setUsers(allUsers);
            return { success: true, user: existingUser };
          }

          // Profile is missing from localStorage (cleared storage / new device).
          // Build it from the Supabase user metadata and persist it.
          const newUser: User = {
            id: data.user.id,
            name: data.user.user_metadata?.name || cleanEmail.split('@')[0] || 'VNR Student',
            email: cleanEmail,
            branch: data.user.user_metadata?.branch || 'Computer Science & Engineering',
            batch: data.user.user_metadata?.batch || '2nd Year (2024-2028)',
            gender: data.user.user_metadata?.gender || 'Prefer not to say',
            bio: data.user.user_metadata?.bio || '',
            avatar_url: getNeutralAvatarUrl(data.user.user_metadata?.name),
            role: 'student',
            created_at: data.user.created_at || new Date().toISOString(),
          };
          const updatedUsers = [newUser, ...allUsers];
          if (typeof window !== 'undefined') {
            localStorage.setItem('passon_users', JSON.stringify(updatedUsers));
          }
          setCurrentUser(newUser);
          dbService.setCurrentUserId(newUser.id);
          setUsers(updatedUsers);
          return { success: true, user: newUser };
        }
      } catch (err: any) {
        console.warn('[AuthContext] Supabase signInWithPassword note:', err);
      }
    }

    // Supabase is not configured — fall back to the local localStorage store.
    const allUsers = dbService.getUsers();
    const foundUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (foundUser) {
      setCurrentUser(foundUser);
      dbService.setCurrentUserId(foundUser.id);
      setUsers(allUsers);
      return { success: true, user: foundUser };
    }

    return {
      success: false,
      error: 'User with this email was not found. Please sign up or check your credentials.',
    };
  };

  const signup = async (
    name: string,
    email: string,
    password?: string,
    branch?: string,
    batch?: string,
    gender?: Gender,
    bio?: string
  ): Promise<SignupResult> => {
    initializeDatabase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const allUsers = dbService.getUsers();

    const redirectUrl = `${getURL()}auth/callback`;
    console.log('[AuthContext] Starting signup for:', cleanEmail, '| Redirect URL:', redirectUrl);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password || 'PassOn2026!',
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: cleanName,
              branch: branch || 'Computer Science & Engineering',
              batch: batch || '2nd Year (2024-2028)',
              gender: gender || 'Prefer not to say',
              bio: bio?.trim() || '',
            },
          },
        });

        console.log('[AuthContext] Supabase signUp response details:', {
          hasData: Boolean(data),
          hasUser: Boolean(data?.user),
          hasSession: Boolean(data?.session),
          identitiesLength: data?.user?.identities?.length,
          error: error?.message,
        });

        if (error) {
          console.error('[AuthContext] Supabase signUp error:', error.message);
          const errMsg = error.message.toLowerCase();
          if (
            errMsg.includes('already registered') ||
            errMsg.includes('already exists') ||
            errMsg.includes('user_already_exists')
          ) {
            return {
              success: false,
              isAlreadyRegistered: true,
              error: 'This email is already registered. Please log in.',
            };
          }
          return {
            success: false,
            error: error.message,
          };
        }

        if (data?.user) {
          // If Supabase returns empty identities array, email already exists
          if (data.user.identities && data.user.identities.length === 0) {
            console.warn('[AuthContext] User already registered (empty identities returned by Supabase)');
            return {
              success: false,
              isAlreadyRegistered: true,
              error: 'This email is already registered. Please log in.',
            };
          }

          const existingUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
          const newUserObj: User = {
            id: data.user.id || existingUser?.id || `user-${Date.now()}`,
            name: cleanName,
            email: cleanEmail,
            branch: branch || 'Computer Science & Engineering',
            batch: batch || '2nd Year (2024-2028)',
            gender: gender || 'Prefer not to say',
            bio: bio?.trim() || '',
            avatar_url: getNeutralAvatarUrl(cleanName),
            role: 'student',
            created_at: new Date().toISOString(),
          };

          if (existingUser) {
            dbService.updateProfile(existingUser.id, newUserObj);
          } else {
            const updatedUsers = [newUserObj, ...allUsers];
            if (typeof window !== 'undefined') {
              localStorage.setItem('passon_users', JSON.stringify(updatedUsers));
              window.dispatchEvent(new Event('passon_db_change'));
            }
            setUsers(updatedUsers);
          }

          // Case 1: Email confirmation required (data.session is null)
          if (!data.session) {
            console.log('[AuthContext] Account created. Verification email sent to:', cleanEmail);
            return {
              success: true,
              requiresVerification: true,
              message: 'Account created successfully. Please check your email to verify your account.',
            };
          }

          // Case 2: Direct session created (email confirmation disabled in Supabase)
          console.log('[AuthContext] Account created & logged in immediately:', cleanEmail);
          setCurrentUser(newUserObj);
          dbService.setCurrentUserId(newUserObj.id);
          return {
            success: true,
            requiresVerification: false,
            user: newUserObj,
            message: 'Account created successfully.',
          };
        }
      } catch (err: any) {
        console.error('[AuthContext] Unexpected signup exception:', err);
        return {
          success: false,
          error: err.message || 'An unexpected error occurred during signup.',
        };
      }
    }

    // Local fallback if Supabase is not configured
    const existingUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return {
        success: false,
        isAlreadyRegistered: true,
        error: 'This email is already registered. Please log in.',
      };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      branch: branch || 'Computer Science & Engineering',
      batch: batch || '2nd Year (2024-2028)',
      gender: gender || 'Prefer not to say',
      bio: bio?.trim() || '',
      avatar_url: getNeutralAvatarUrl(cleanName),
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

    return {
      success: true,
      requiresVerification: false,
      user: newUser,
      message: 'Account created successfully.',
    };
  };

  const resetPasswordForEmail = async (email: string): Promise<ResetPasswordResult> => {
    initializeDatabase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your registered email address.' };
    }

    // Point directly at /reset-password so Supabase delivers ?code= straight to the
    // client-side page that can exchange it for a browser session.
    const baseUrl = getURL().replace(/\/$/, '');
    const redirectUrl = `${baseUrl}/reset-password`;
    console.log('[AuthContext] resetPasswordForEmail for:', cleanEmail, '| Redirect:', redirectUrl);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectUrl,
        });

        if (error) {
          console.error('[AuthContext] resetPasswordForEmail error:', error.message);
          return { success: false, error: error.message };
        }

        return {
          success: true,
          message: 'Password reset link sent. Please check your email.',
        };
      } catch (err: any) {
        console.error('[AuthContext] resetPasswordForEmail exception:', err);
        return {
          success: false,
          error: err.message || 'Could not send password reset email. Please try again.',
        };
      }
    }

    return {
      success: true,
      message: 'Password reset link sent. Please check your email.',
    };
  };

  const updatePassword = async (newPassword: string): Promise<ResetPasswordResult> => {
    initializeDatabase();

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    console.log('[AuthContext] Updating user password via Supabase...');

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          console.error('[AuthContext] updateUser password error:', error.message);
          return { success: false, error: error.message };
        }

        console.log('[AuthContext] Password updated successfully for user:', data.user?.email);
        return {
          success: true,
          message: 'Your password has been updated successfully.',
        };
      } catch (err: any) {
        console.error('[AuthContext] updateUser password exception:', err);
        return {
          success: false,
          error: err.message || 'Could not update password. Please try again.',
        };
      }
    }

    return {
      success: true,
      message: 'Your password has been updated successfully.',
    };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('[AuthContext] Supabase signOut notice:', e);
      }
    }
    setCurrentUser(null);
    dbService.setCurrentUserId('');
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
        resetPasswordForEmail,
        updatePassword,
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