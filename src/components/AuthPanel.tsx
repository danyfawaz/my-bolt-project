import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { LogIn, LogOut, User, Mail, Lock } from 'lucide-react';

/**
 * Authentication panel component for login/logout functionality
 * Supports email/password authentication with Supabase
 */
export function AuthPanel() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setError(null);
        // Auto-login after signup for local development
        await supabase.auth.signInWithPassword({ email, password });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
        <p className="text-sm text-surface-500">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-full">
            <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
              Logged in
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 truncate max-w-[200px]">
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 rounded-lg transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('login')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === 'login'
              ? 'bg-brand-600 text-white'
              : 'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === 'signup'
              ? 'bg-brand-600 text-white'
              : 'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300'
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="test@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading
              ? mode === 'login'
                ? 'Logging in...'
                : 'Creating account...'
              : mode === 'login'
              ? 'Login'
              : 'Create Account'}
          </button>
        </div>
      </form>

      <p className="mt-3 text-xs text-surface-500 dark:text-surface-400 text-center">
        {mode === 'login'
          ? "Don't have an account? Click Sign Up above"
          : 'Create an account to test notifications'}
      </p>
    </div>
  );
}

export default AuthPanel;
