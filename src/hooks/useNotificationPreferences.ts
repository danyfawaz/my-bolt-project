import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  NotificationPreferences,
  NotificationChannel,
  NotificationCategory,
} from '../types/notificationPreferences';
import { DEFAULT_PREFERENCES } from '../types/notificationPreferences';
import { NotificationPreferencesService } from '../services/NotificationPreferencesService';
import { useAuth } from './useAuth';

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences;
  loading: boolean;
  isDemoMode: boolean;

  // Channel toggles
  toggleChannel: (channel: NotificationChannel) => void;

  // Event toggles
  toggleEventChannel: (eventType: string, channel: NotificationChannel) => void;

  // Category toggles
  toggleCategory: (category: NotificationCategory, enabled?: boolean) => void;

  // Category state helpers
  isCategoryEnabled: (category: NotificationCategory) => boolean;
  isCategoryPartial: (category: NotificationCategory) => boolean;
  getCategoryState: (category: NotificationCategory) => 'enabled' | 'partial' | 'disabled';

  // Quiet hours
  setQuietHoursEnabled: (enabled: boolean) => void;
  setQuietHoursStart: (time: string) => void;
  setQuietHoursEnd: (time: string) => void;

  // Sound
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;

  // Reset
  resetToDefaults: () => void;
}

/**
 * Hook for managing notification preferences
 * Automatically uses localStorage in demo mode, Supabase when authenticated
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Check if we're in demo mode via URL param
  const isDemoMode = useMemo(() => {
    if (typeof window === 'undefined') return true;
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') === 'true';
  }, []);

  // Get authenticated user ID from auth hook
  const { userId } = useAuth();

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);
      try {
        if (isDemoMode || !userId) {
          // Demo mode or unauthenticated: use localStorage
          const stored = NotificationPreferencesService.getFromLocalStorage();
          setPreferences(stored);
        } else {
          // Authenticated: use Supabase
          const dbPrefs = await NotificationPreferencesService.getByUserId(userId);
          setPreferences(dbPrefs || DEFAULT_PREFERENCES);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [isDemoMode, userId]);

  // Save preferences helper
  const savePreferences = useCallback(
    async (newPrefs: NotificationPreferences) => {
      setPreferences(newPrefs);

      if (isDemoMode || !userId) {
        NotificationPreferencesService.saveToLocalStorage(newPrefs);
      } else {
        await NotificationPreferencesService.upsert(userId, newPrefs);
      }
    },
    [isDemoMode, userId]
  );

  // Toggle global channel
  const toggleChannel = useCallback(
    (channel: NotificationChannel) => {
      const newPrefs = NotificationPreferencesService.toggleChannel(preferences, channel);
      savePreferences(newPrefs);
    },
    [preferences, savePreferences]
  );

  // Toggle event channel
  const toggleEventChannel = useCallback(
    (eventType: string, channel: NotificationChannel) => {
      const newPrefs = NotificationPreferencesService.toggleEventChannel(
        preferences,
        eventType,
        channel
      );
      savePreferences(newPrefs);
    },
    [preferences, savePreferences]
  );

  // Toggle category
  const toggleCategory = useCallback(
    (category: NotificationCategory, enabled?: boolean) => {
      const newPrefs = NotificationPreferencesService.toggleCategory(
        preferences,
        category,
        enabled
      );
      savePreferences(newPrefs);
    },
    [preferences, savePreferences]
  );

  // Category state helpers
  const isCategoryEnabled = useCallback(
    (category: NotificationCategory) =>
      NotificationPreferencesService.isCategoryFullyEnabled(preferences, category),
    [preferences]
  );

  const isCategoryPartial = useCallback(
    (category: NotificationCategory) =>
      NotificationPreferencesService.isCategoryPartiallyEnabled(preferences, category),
    [preferences]
  );

  const getCategoryState = useCallback(
    (category: NotificationCategory) =>
      NotificationPreferencesService.getCategoryState(preferences, category),
    [preferences]
  );

  // Quiet hours setters
  const setQuietHoursEnabled = useCallback(
    (enabled: boolean) => {
      savePreferences({ ...preferences, quiet_hours_enabled: enabled });
    },
    [preferences, savePreferences]
  );

  const setQuietHoursStart = useCallback(
    (time: string) => {
      savePreferences({ ...preferences, quiet_hours_start: time });
    },
    [preferences, savePreferences]
  );

  const setQuietHoursEnd = useCallback(
    (time: string) => {
      savePreferences({ ...preferences, quiet_hours_end: time });
    },
    [preferences, savePreferences]
  );

  // Sound setters
  const setSoundEnabled = useCallback(
    (enabled: boolean) => {
      savePreferences({ ...preferences, sound_enabled: enabled });
    },
    [preferences, savePreferences]
  );

  const setSoundVolume = useCallback(
    (volume: number) => {
      savePreferences({ ...preferences, sound_volume: Math.max(0, Math.min(100, volume)) });
    },
    [preferences, savePreferences]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    savePreferences({ ...DEFAULT_PREFERENCES });
  }, [savePreferences]);

  return {
    preferences,
    loading,
    isDemoMode,
    toggleChannel,
    toggleEventChannel,
    toggleCategory,
    isCategoryEnabled,
    isCategoryPartial,
    getCategoryState,
    setQuietHoursEnabled,
    setQuietHoursStart,
    setQuietHoursEnd,
    setSoundEnabled,
    setSoundVolume,
    resetToDefaults,
  };
}

export default useNotificationPreferences;
