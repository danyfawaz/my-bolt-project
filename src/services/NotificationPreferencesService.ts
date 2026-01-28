import { supabase } from '../lib/supabase';
import type {
  NotificationPreferences,
  NotificationChannel,
  NotificationCategory,
  EventChannelPreferences,
} from '../types/notificationPreferences';
import {
  DEFAULT_PREFERENCES,
  CATEGORY_EVENT_MAP,
} from '../types/notificationPreferences';

const LOCALSTORAGE_KEY = 'notification_preferences';

/**
 * NotificationPreferencesService - Manages notification preferences
 * Supports both Supabase (authenticated) and localStorage (demo mode)
 */
export class NotificationPreferencesService {
  // ============================================
  // Supabase Operations (Authenticated Users)
  // ============================================

  /**
   * Get preferences for a user from Supabase
   */
  static async getByUserId(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, return null (will create on first save)
        return null;
      }
      console.error('NotificationPreferencesService.getByUserId error:', error);
      return null;
    }

    return this.mapFromDatabase(data);
  }

  /**
   * Create or update preferences in Supabase
   */
  static async upsert(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences | null> {
    const dbRecord = this.mapToDatabase(userId, preferences);

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(dbRecord, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('NotificationPreferencesService.upsert error:', error);
      return null;
    }

    return this.mapFromDatabase(data);
  }

  /**
   * Update specific preference fields
   */
  static async update(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences | null> {
    // First get existing preferences
    const existing = await this.getByUserId(userId);
    const merged = { ...DEFAULT_PREFERENCES, ...existing, ...updates };

    return this.upsert(userId, merged);
  }

  /**
   * Delete preferences for a user
   */
  static async delete(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notification_preferences')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('NotificationPreferencesService.delete error:', error);
      return false;
    }

    return true;
  }

  // ============================================
  // localStorage Operations (Demo Mode)
  // ============================================

  /**
   * Get preferences from localStorage
   */
  static getFromLocalStorage(): NotificationPreferences {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Error reading preferences from localStorage:', error);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save preferences to localStorage
   */
  static saveToLocalStorage(preferences: NotificationPreferences): void {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
    }
  }

  /**
   * Clear preferences from localStorage
   */
  static clearLocalStorage(): void {
    localStorage.removeItem(LOCALSTORAGE_KEY);
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Toggle a global channel on/off
   */
  static toggleChannel(
    preferences: NotificationPreferences,
    channel: NotificationChannel
  ): NotificationPreferences {
    const newEnabled = !preferences.channels_enabled[channel];
    const newChannelsEnabled = {
      ...preferences.channels_enabled,
      [channel]: newEnabled,
    };

    // If disabling a channel, also disable it for all events
    let newEventPreferences = { ...preferences.event_preferences };
    if (!newEnabled) {
      newEventPreferences = Object.fromEntries(
        Object.entries(newEventPreferences).map(([eventType, prefs]) => [
          eventType,
          { ...prefs, [channel]: false },
        ])
      );
    }

    return {
      ...preferences,
      channels_enabled: newChannelsEnabled,
      event_preferences: newEventPreferences,
    };
  }

  /**
   * Toggle a specific event's channel
   */
  static toggleEventChannel(
    preferences: NotificationPreferences,
    eventType: string,
    channel: NotificationChannel
  ): NotificationPreferences {
    const currentEventPrefs = preferences.event_preferences[eventType] || {
      in_app: false,
      email: false,
      push: false,
    };

    return {
      ...preferences,
      event_preferences: {
        ...preferences.event_preferences,
        [eventType]: {
          ...currentEventPrefs,
          [channel]: !currentEventPrefs[channel],
        },
      },
    };
  }

  /**
   * Toggle all events in a category
   */
  static toggleCategory(
    preferences: NotificationPreferences,
    category: NotificationCategory,
    enabled?: boolean
  ): NotificationPreferences {
    const events = CATEGORY_EVENT_MAP[category];
    const shouldEnable = enabled ?? !this.isCategoryFullyEnabled(preferences, category);

    const newEventPreferences = { ...preferences.event_preferences };
    events.forEach((eventType) => {
      const currentPrefs = newEventPreferences[eventType] || {
        in_app: false,
        email: false,
        push: false,
      };

      if (shouldEnable) {
        // Enable based on global channel settings
        newEventPreferences[eventType] = {
          in_app: preferences.channels_enabled.in_app,
          email: preferences.channels_enabled.email,
          push: preferences.channels_enabled.push,
        };
      } else {
        // Disable all channels for this event
        newEventPreferences[eventType] = {
          in_app: false,
          email: false,
          push: false,
        };
      }
    });

    return {
      ...preferences,
      event_preferences: newEventPreferences,
      category_enabled: {
        ...preferences.category_enabled,
        [category]: shouldEnable,
      },
    };
  }

  /**
   * Check if a category is fully enabled (all events have at least one channel)
   */
  static isCategoryFullyEnabled(
    preferences: NotificationPreferences,
    category: NotificationCategory
  ): boolean {
    const events = CATEGORY_EVENT_MAP[category];
    return events.every((eventType) => {
      const prefs = preferences.event_preferences[eventType];
      return prefs && (prefs.in_app || prefs.email || prefs.push);
    });
  }

  /**
   * Check if a category is partially enabled
   */
  static isCategoryPartiallyEnabled(
    preferences: NotificationPreferences,
    category: NotificationCategory
  ): boolean {
    const events = CATEGORY_EVENT_MAP[category];
    const enabledCount = events.filter((eventType) => {
      const prefs = preferences.event_preferences[eventType];
      return prefs && (prefs.in_app || prefs.email || prefs.push);
    }).length;

    return enabledCount > 0 && enabledCount < events.length;
  }

  /**
   * Get category state for UI display
   */
  static getCategoryState(
    preferences: NotificationPreferences,
    category: NotificationCategory
  ): 'enabled' | 'partial' | 'disabled' {
    if (this.isCategoryFullyEnabled(preferences, category)) return 'enabled';
    if (this.isCategoryPartiallyEnabled(preferences, category)) return 'partial';
    return 'disabled';
  }

  // ============================================
  // Database Mapping
  // ============================================

  private static mapToDatabase(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Record<string, unknown> {
    return {
      user_id: userId,
      channels_enabled: preferences.channels_enabled,
      event_preferences: preferences.event_preferences,
      category_enabled: preferences.category_enabled,
      quiet_hours_enabled: preferences.quiet_hours_enabled,
      quiet_hours_start: preferences.quiet_hours_start,
      quiet_hours_end: preferences.quiet_hours_end,
      quiet_hours_timezone: preferences.quiet_hours_timezone,
      sound_enabled: preferences.sound_enabled,
      sound_volume: preferences.sound_volume,
      updated_at: new Date().toISOString(),
    };
  }

  private static mapFromDatabase(data: Record<string, unknown>): NotificationPreferences {
    return {
      id: data.id as string,
      user_id: data.user_id as string,
      channels_enabled: data.channels_enabled as Record<NotificationChannel, boolean>,
      event_preferences: data.event_preferences as Record<string, EventChannelPreferences>,
      category_enabled: data.category_enabled as Record<NotificationCategory, boolean>,
      quiet_hours_enabled: data.quiet_hours_enabled as boolean,
      quiet_hours_start: data.quiet_hours_start as string,
      quiet_hours_end: data.quiet_hours_end as string,
      quiet_hours_timezone: data.quiet_hours_timezone as string,
      sound_enabled: data.sound_enabled as boolean,
      sound_volume: data.sound_volume as number,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  }
}

export default NotificationPreferencesService;
