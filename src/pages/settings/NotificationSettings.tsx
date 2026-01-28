import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, RotateCcw, FlaskConical } from 'lucide-react';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import type { NotificationCategory } from '../../types/notificationPreferences';
import { ChannelSelector } from '../../components/preferences/ChannelSelector';
import { CategoryToggle } from '../../components/preferences/CategoryToggle';
import { QuietHoursConfig } from '../../components/preferences/QuietHoursConfig';
import { SoundToggle } from '../../components/preferences/SoundToggle';

const CATEGORIES: NotificationCategory[] = [
  'task_management',
  'deliverable_workflow',
  'collaboration',
];

export function NotificationSettings() {
  const {
    preferences,
    loading,
    isDemoMode,
    toggleChannel,
    toggleCategory,
    toggleEventChannel,
    getCategoryState,
    setQuietHoursEnabled,
    setQuietHoursStart,
    setQuietHoursEnd,
    setSoundEnabled,
    setSoundVolume,
    resetToDefaults,
  } = useNotificationPreferences();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    resetToDefaults();
    setShowResetConfirm(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-surface-200 dark:border-surface-700 border-t-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="
            inline-flex items-center gap-2 mb-4
            text-sm text-surface-500 dark:text-surface-400
            hover:text-surface-700 dark:hover:text-surface-200
            transition-colors duration-200
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-500/10 dark:bg-brand-500/20">
            <Bell className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              Notification Settings
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              Manage how and when you receive notifications
            </p>
          </div>
          {isDemoMode && (
            <span className="
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ml-auto
              text-xs font-medium uppercase tracking-wide
              bg-amber-500/10 text-amber-600 dark:text-amber-400
              border border-amber-500/20
            ">
              <FlaskConical className="h-3.5 w-3.5" />
              Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {/* Channels Section */}
        <section className="
          p-6 rounded-2xl
          bg-white dark:bg-surface-900
          border border-surface-200 dark:border-surface-800
          shadow-sm
        ">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">
            Delivery Channels
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-5">
            Choose how you want to receive notifications
          </p>
          <ChannelSelector
            channelsEnabled={preferences.channels_enabled}
            onToggle={toggleChannel}
          />
        </section>

        {/* Notification Types Section */}
        <section className="
          p-6 rounded-2xl
          bg-white dark:bg-surface-900
          border border-surface-200 dark:border-surface-800
          shadow-sm
        ">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">
            Notification Types
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-5">
            Configure which notifications you receive for each category
          </p>
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            {CATEGORIES.map((category) => (
              <CategoryToggle
                key={category}
                category={category}
                preferences={preferences}
                state={getCategoryState(category)}
                onToggleCategory={toggleCategory}
                onToggleEventChannel={toggleEventChannel}
              />
            ))}
          </div>
        </section>

        {/* Quiet Hours Section */}
        <section className="
          p-6 rounded-2xl
          bg-white dark:bg-surface-900
          border border-surface-200 dark:border-surface-800
          shadow-sm
        ">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">
            Quiet Hours
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-5">
            Pause notifications during specific hours
          </p>
          <QuietHoursConfig
            enabled={preferences.quiet_hours_enabled}
            startTime={preferences.quiet_hours_start}
            endTime={preferences.quiet_hours_end}
            onToggle={setQuietHoursEnabled}
            onStartTimeChange={setQuietHoursStart}
            onEndTimeChange={setQuietHoursEnd}
          />
        </section>

        {/* Sound Section */}
        <section className="
          p-6 rounded-2xl
          bg-white dark:bg-surface-900
          border border-surface-200 dark:border-surface-800
          shadow-sm
        ">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">
            Sound
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-5">
            Configure notification sounds
          </p>
          <SoundToggle
            enabled={preferences.sound_enabled}
            volume={preferences.sound_volume}
            onToggle={setSoundEnabled}
            onVolumeChange={setSoundVolume}
          />
        </section>

        {/* Reset Section */}
        <section className="
          p-6 rounded-2xl
          bg-surface-50 dark:bg-surface-900/50
          border border-surface-200 dark:border-surface-800
        ">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-surface-900 dark:text-surface-50">
                Reset to Defaults
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                Restore all notification settings to their default values
              </p>
            </div>
            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="
                    px-3 py-1.5 text-sm rounded-lg
                    text-surface-600 dark:text-surface-400
                    hover:bg-surface-200 dark:hover:bg-surface-700
                    transition-colors duration-200
                  "
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="
                    px-3 py-1.5 text-sm rounded-lg
                    bg-red-500 text-white
                    hover:bg-red-600
                    transition-colors duration-200
                  "
                >
                  Confirm Reset
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  text-sm text-surface-600 dark:text-surface-400
                  border border-surface-300 dark:border-surface-700
                  hover:bg-surface-100 dark:hover:bg-surface-800
                  hover:border-surface-400 dark:hover:border-surface-600
                  transition-all duration-200
                "
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default NotificationSettings;
