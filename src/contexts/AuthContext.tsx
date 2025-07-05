import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { UserData } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Auth provider initialized");
    
    // First set up the auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === 'SIGNED_IN' && session) {
          // Don't fetch user data here - it causes deadlocks
          // Instead, use setTimeout to defer the database query
          setTimeout(async () => {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
                
              if (!error && data) {
                console.log("User data after sign in:", data.role);
                setUser(data as UserData);
                
                // Check if user needs to change password
                if (data.password_changed === false) {
                  navigate('/change-password', { replace: true });
                  return;
                }
                
                // Only navigate if we're on the login page or change password page
                if (location.pathname === '/' || location.pathname === '/change-password') {
                  if (data.role === 'teacher') {
                    navigate('/teacher', { replace: true });
                  } else if (data.role === 'student') {
                    navigate('/student', { replace: true });
                  }
                }
              } else {
                console.error("Error fetching user data after sign in:", error);
                setUser(null);
                toast({
                  title: "Error",
                  description: "Could not fetch user data. Please try again.",
                  variant: "destructive"
                });
              }
            } catch (error) {
              console.error("Error in auth state change handler:", error);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          navigate('/', { replace: true });
        }
      }
    );

    // Then check for existing session
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session check:", session ? "Session exists" : "No session");
        
        if (session) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (!error && data) {
            console.log("User data fetched:", data.role);
            setUser(data as UserData);
            
            // Check if user needs to change password
            if (data.password_changed === false) {
              navigate('/change-password', { replace: true });
              return;
            }
            
            // Only navigate if we're on the login page or change password page
            if (location.pathname === '/' || location.pathname === '/change-password') {
              if (data.role === 'teacher') {
                navigate('/teacher', { replace: true });
              } else if (data.role === 'student') {
                navigate('/student', { replace: true });
              }
            }
          } else {
            console.error("Error fetching user data:", error);
            setUser(null);
            toast({
              title: "Error",
              description: "Could not fetch user data. Please try again.",
              variant: "destructive"
            });
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Session fetch error:", error);
        setLoading(false);
        toast({
          title: "Error",
          description: "Authentication error. Please try again.",
          variant: "destructive"
        });
      }
    };

    fetchSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error signing in:', error.message);
        return { error };
      }

      // Don't fetch user data here - the onAuthStateChange handler will do it
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
