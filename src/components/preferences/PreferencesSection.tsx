import { useState } from 'react';
import { ChevronDown, RotateCcw, FlaskConical } from 'lucide-react';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import type { NotificationCategory } from '../../types/notificationPreferences';
import { ChannelSelector } from './ChannelSelector';
import { CategoryToggle } from './CategoryToggle';
import { QuietHoursConfig } from './QuietHoursConfig';
import { SoundToggle } from './SoundToggle';

interface PreferencesSectionProps {
  expanded: boolean;
  onToggleExpand: () => void;
}

const CATEGORIES: NotificationCategory[] = [
  'task_management',
  'deliverable_workflow',
  'collaboration',
];

export function PreferencesSection({ expanded, onToggleExpand }: PreferencesSectionProps) {
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
      <div className="px-5 py-3 border-t border-surface-200/80 dark:border-surface-700/50">
        <div className="flex items-center justify-center py-4">
          <div className="h-5 w-5 rounded-full border-2 border-surface-200 dark:border-surface-700 border-t-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-surface-200/80 dark:border-surface-700/50">
      {/* Toggle Bar */}
      <button
        onClick={onToggleExpand}
        className="
          w-full px-5 py-3
          flex items-center justify-between
          bg-surface-50/50 dark:bg-surface-900/50
          hover:bg-surface-100/50 dark:hover:bg-surface-800/50
          transition-colors duration-200
        "
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
            Notification Preferences
          </span>
          {isDemoMode && (
            <span className="
              inline-flex items-center gap-1 px-1.5 py-0.5 rounded
              text-[10px] font-medium uppercase tracking-wide
              bg-amber-500/10 text-amber-600 dark:text-amber-400
            ">
              <FlaskConical className="h-3 w-3" />
              Demo
            </span>
          )}
        </div>
        <ChevronDown
          className={`
            h-4 w-4 text-surface-400 dark:text-surface-500
            transition-transform duration-200
            ${expanded ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="
          px-5 py-4 space-y-6
          max-h-[400px] overflow-y-auto notification-scrollbar
          animate-slide-down
        ">
          {/* Channel Selector */}
          <ChannelSelector
            channelsEnabled={preferences.channels_enabled}
            onToggle={toggleChannel}
          />

          {/* Notification Types */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2">
              Notification Types
            </h4>
            <div className="rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
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
          </div>

          {/* Quiet Hours */}
          <div className="pt-2 border-t border-surface-100 dark:border-surface-800">
            <QuietHoursConfig
              enabled={preferences.quiet_hours_enabled}
              startTime={preferences.quiet_hours_start}
              endTime={preferences.quiet_hours_end}
              onToggle={setQuietHoursEnabled}
              onStartTimeChange={setQuietHoursStart}
              onEndTimeChange={setQuietHoursEnd}
            />
          </div>

          {/* Sound */}
          <div className="pt-2 border-t border-surface-100 dark:border-surface-800">
            <SoundToggle
              enabled={preferences.sound_enabled}
              volume={preferences.sound_volume}
              onToggle={setSoundEnabled}
              onVolumeChange={setSoundVolume}
            />
          </div>

          {/* Reset Button */}
          <div className="pt-2 border-t border-surface-100 dark:border-surface-800">
            {showResetConfirm ? (
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-red-500/10 dark:bg-red-500/20">
                <span className="text-xs text-red-600 dark:text-red-400">
                  Reset all preferences?
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="
                      px-2 py-1 text-xs rounded
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
                      px-2 py-1 text-xs rounded
                      bg-red-500 text-white
                      hover:bg-red-600
                      transition-colors duration-200
                    "
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="
                  flex items-center gap-1.5
                  text-xs text-surface-500 dark:text-surface-400
                  hover:text-surface-700 dark:hover:text-surface-200
                  transition-colors duration-200
                "
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Defaults
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PreferencesSection;
