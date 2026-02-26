import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

type AppRole = 'admin' | 'student';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const clearPersistedAuthState = () => {
    try {
      const authStorageKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
      );

      authStorageKeys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing persisted auth state:', error);
    }
  };

  const toFriendlyAuthError = (error: unknown, fallbackMessage: string) => {
    const message = error instanceof Error ? error.message.toLowerCase() : '';

    if (message.includes('failed to fetch')) {
      return new Error('Unable to reach authentication service. Check your internet and try again.');
    }

    return error instanceof Error ? error : new Error(fallbackMessage);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return (data ?? null) as Profile | null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return (data ?? null) as UserRole | null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const loadUserContext = async (userId: string) => {
    const [profileData, roleData] = await Promise.all([
      fetchProfile(userId),
      fetchUserRole(userId),
    ]);

    return { profileData, roleData };
  };

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      const { profileData, roleData } = await loadUserContext(nextSession.user.id);

      if (!isMounted) return;
      setProfile(profileData);
      setUserRole(roleData);
      setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        void syncAuthState(nextSession);
      }
    );

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        await syncAuthState(data.session);
      } catch (error) {
        console.error('Error initializing auth session:', error);
        clearPersistedAuthState();

        if (!isMounted) return;

        setSession(null);
        setUser(null);
        setProfile(null);
        setUserRole(null);
        setIsLoading(false);
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { error: toFriendlyAuthError(error, 'Failed to create account') };
      }

      return { error: null };
    } catch (error) {
      return { error: toFriendlyAuthError(error, 'Failed to create account') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { error: toFriendlyAuthError(error, 'Failed to sign in') };
      }

      return { error: null };
    } catch (error) {
      return { error: toFriendlyAuthError(error, 'Failed to sign in') };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(null);
      clearPersistedAuthState();
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: toFriendlyAuthError(error, 'Failed to send password reset email') };
      }

      return { error: null };
    } catch (error) {
      return { error: toFriendlyAuthError(error, 'Failed to send password reset email') };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: toFriendlyAuthError(error, 'Failed to update password') };
      }

      return { error: null };
    } catch (error) {
      return { error: toFriendlyAuthError(error, 'Failed to update password') };
    }
  };

  const value = {
    user,
    session,
    profile,
    userRole,
    isLoading,
    isAdmin: userRole?.role === 'admin',
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
