import { Bell, Mail, Smartphone } from 'lucide-react';
import type { NotificationChannel, EventChannelPreferences } from '../../types/notificationPreferences';
import { EVENT_LABELS } from '../../types/notificationPreferences';

interface EventToggleProps {
  eventType: string;
  channelPrefs: EventChannelPreferences;
  globalChannels: Record<NotificationChannel, boolean>;
  onToggle: (eventType: string, channel: NotificationChannel) => void;
}

const CHANNEL_ICONS: Record<NotificationChannel, typeof Bell> = {
  in_app: Bell,
  email: Mail,
  push: Smartphone,
};

const CHANNELS: NotificationChannel[] = ['in_app', 'email', 'push'];

export function EventToggle({
  eventType,
  channelPrefs,
  globalChannels,
  onToggle,
}: EventToggleProps) {
  const label = EVENT_LABELS[eventType] || eventType;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-surface-600 dark:text-surface-400">
        {label}
      </span>
      <div className="flex items-center gap-1">
        {CHANNELS.map((channel) => {
          const Icon = CHANNEL_ICONS[channel];
          const enabled = channelPrefs[channel];
          const globalDisabled = !globalChannels[channel];

          return (
            <button
              key={channel}
              onClick={() => !globalDisabled && onToggle(eventType, channel)}
              disabled={globalDisabled}
              className={`
                p-1.5 rounded-md transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-brand-500/50
                ${globalDisabled
                  ? 'opacity-30 cursor-not-allowed'
                  : enabled
                    ? 'bg-brand-500/15 dark:bg-brand-500/25 text-brand-600 dark:text-brand-400'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700'
                }
              `}
              title={`${enabled ? 'Disable' : 'Enable'} ${channel.replace('_', ' ')} notifications`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default EventToggle;
