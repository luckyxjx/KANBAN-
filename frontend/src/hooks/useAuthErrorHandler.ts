import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to handle authentication errors and session management
 * Provides centralized error handling for authentication failures
 */
export const useAuthErrorHandler = () => {
  const { user, checkAuth } = useAuth();

  useEffect(() => {
    // Set up periodic authentication check
    const checkAuthPeriodically = async () => {
      if (user) {
        try {
          await checkAuth();
        } catch (error) {
          console.error('Periodic auth check failed:', error);
          // Auth context will handle the redirect via axios interceptor
        }
      }
    };

    // Check authentication every 5 minutes if user is logged in
    const interval = setInterval(checkAuthPeriodically, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [user, checkAuth]);

  // Handle page focus events to re-check authentication
  useEffect(() => {
    const handleFocus = async () => {
      if (user && document.visibilityState === 'visible') {
        try {
          await checkAuth();
        } catch (error) {
          console.error('Focus auth check failed:', error);
          // Auth context will handle the redirect via axios interceptor
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user, checkAuth]);
};