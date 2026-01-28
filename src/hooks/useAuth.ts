import { useContext } from 'react';
import { WebSocketContext } from '../providers/WebSocketProvider';
import type { User } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
}

/**
 * Hook to access authentication state from WebSocketProvider
 * Provides user information and authentication status
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useAuth must be used within a WebSocketProvider');
  }

  const { user, status } = context;

  return {
    user,
    isAuthenticated: !!user,
    isLoading: status === 'connecting',
    userId: user?.id ?? null,
  };
}

export default useAuth;
