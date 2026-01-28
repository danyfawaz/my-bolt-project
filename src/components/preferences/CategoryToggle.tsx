import { useState } from 'react';
import { ChevronRight, Check, Minus } from 'lucide-react';
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationPreferences,
} from '../../types/notificationPreferences';
import {
  CATEGORY_LABELS,
  CATEGORY_EVENT_MAP,
} from '../../types/notificationPreferences';
import { EventToggle } from './EventToggle';

interface CategoryToggleProps {
  category: NotificationCategory;
  preferences: NotificationPreferences;
  state: 'enabled' | 'partial' | 'disabled';
  onToggleCategory: (category: NotificationCategory) => void;
  onToggleEventChannel: (eventType: string, channel: NotificationChannel) => void;
}

export function CategoryToggle({
  category,
  preferences,
  state,
  onToggleCategory,
  onToggleEventChannel,
}: CategoryToggleProps) {
  const [expanded, setExpanded] = useState(false);
  const events = CATEGORY_EVENT_MAP[category];
  const label = CATEGORY_LABELS[category];

  const getStateIcon = () => {
    switch (state) {
      case 'enabled':
        return <Check className="h-3.5 w-3.5 text-brand-500" />;
      case 'partial':
        return <Minus className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="border-b border-surface-100 dark:border-surface-800 last:border-b-0">
      {/* Category Header */}
      <div className="flex items-center gap-2 py-2.5">
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="
            p-1 rounded-md
            text-surface-400 dark:text-surface-500
            hover:bg-surface-100 dark:hover:bg-surface-800
            transition-colors duration-200
          "
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        </button>

        {/* Category Label */}
        <span
          className="flex-1 text-sm font-medium text-surface-700 dark:text-surface-300 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {label}
        </span>

        {/* State Indicator */}
        <div className="w-6 flex justify-center">
          {getStateIcon()}
        </div>

        {/* Category Toggle */}
        <button
          onClick={() => onToggleCategory(category)}
          className={`
            relative inline-flex h-5 w-9 items-center rounded-full
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2
            dark:focus:ring-offset-surface-900
            ${state === 'enabled'
              ? 'bg-brand-500'
              : state === 'partial'
                ? 'bg-amber-500'
                : 'bg-surface-300 dark:bg-surface-600'
            }
          `}
          role="switch"
          aria-checked={state === 'enabled'}
        >
          <span
            className={`
              inline-block h-4 w-4 rounded-full bg-white shadow-sm
              transform transition-transform duration-200
              ${state !== 'disabled' ? 'translate-x-[18px]' : 'translate-x-0.5'}
            `}
          />
        </button>
      </div>

      {/* Expanded Events */}
      {expanded && (
        <div className="pl-8 pb-2 animate-fade-in">
          {events.map((eventType) => {
            const channelPrefs = preferences.event_preferences[eventType] || {
              in_app: false,
              email: false,
              push: false,
            };

            return (
              <EventToggle
                key={eventType}
                eventType={eventType}
                channelPrefs={channelPrefs}
                globalChannels={preferences.channels_enabled}
                onToggle={onToggleEventChannel}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategoryToggle;
