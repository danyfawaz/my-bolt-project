import type { UserPreferences } from '../types';

/**
 * Check if current time is within quiet hours for a user
 */
export function isInQuietHours(preferences: UserPreferences): boolean {
  if (!preferences.quiet_hours_enabled) {
    return false;
  }

  const now = new Date();
  const timezone = preferences.quiet_hours_timezone || 'UTC';

  // Get current time in user's timezone
  const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const currentMinutes = userTime.getHours() * 60 + userTime.getMinutes();

  // Parse start and end times (HH:MM format)
  const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
  const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    // Quiet hours span midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Quiet hours within same day
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

/**
 * Calculate next available delivery time after quiet hours
 */
export function getNextDeliveryTime(preferences: UserPreferences): Date {
  if (!preferences.quiet_hours_enabled) {
    return new Date();
  }

  const now = new Date();
  const timezone = preferences.quiet_hours_timezone || 'UTC';

  // Parse end time
  const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);

  // Create a date object for the end of quiet hours
  const userNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const deliveryTime = new Date(userNow);
  deliveryTime.setHours(endHour, endMin, 0, 0);

  // If the delivery time is in the past, add a day
  if (deliveryTime <= userNow) {
    deliveryTime.setDate(deliveryTime.getDate() + 1);
  }

  return deliveryTime;
}
