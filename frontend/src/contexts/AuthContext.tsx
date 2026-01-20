import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { useDemoData } from './DemoDataProvider';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (provider?: 'google' | 'apple' | 'github') => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://localhost:3000';
axios.defaults.withCredentials = true;

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { demoMode, demoUser } = useDemoData();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup axios interceptors for authentication failure handling
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle authentication failures (401 Unauthorized)
        if (error.response?.status === 401) {
          // Clear user state and redirect to login
          setUser(null);
          // Only redirect if we're not already on the login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      // In demo mode, use demo user
      if (demoMode) {
        setUser(demoUser);
        return true;
      }
      
      const response = await axios.get('/auth/me');
      setUser(response.data);
      return true;
    } catch {
      // Clear user state on authentication failure
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = (provider: 'google' | 'apple' | 'github' = 'google') => {
    // In demo mode, simulate login
    if (demoMode) {
      setUser(demoUser);
      return;
    }
    
    // Redirect to OAuth provider
    window.location.href = `${axios.defaults.baseURL}/auth/${provider}`;
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // In demo mode, just clear user
      if (demoMode) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with cleanup even if request fails
    } finally {
      // Always clear user state and redirect to login
      setUser(null);
      setLoading(false);
      // Redirect to login page after logout
      window.location.href = '/login';
    }
  };

  // Session restoration on page refresh
  useEffect(() => {
    const initAuth = async () => {
      // Check if user is authenticated on app initialization
      await checkAuth();
    };

    initAuth();
  }, [demoMode]); // Re-run when demo mode changes

  // Handle browser navigation events for session persistence
  useEffect(() => {
    const handleBeforeUnload = () => {
      // No special handling needed - httpOnly cookies persist automatically
    };

    const handleVisibilityChange = async () => {
      // Re-check authentication when tab becomes visible
      if (!document.hidden && user) {
        await checkAuth();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
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