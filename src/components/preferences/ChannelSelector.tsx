import { Bell, Mail, Smartphone } from 'lucide-react';
import type { NotificationChannel } from '../../types/notificationPreferences';
import { CHANNEL_LABELS, CHANNEL_DESCRIPTIONS } from '../../types/notificationPreferences';

interface ChannelSelectorProps {
  channelsEnabled: Record<NotificationChannel, boolean>;
  onToggle: (channel: NotificationChannel) => void;
}

const CHANNEL_ICONS: Record<NotificationChannel, typeof Bell> = {
  in_app: Bell,
  email: Mail,
  push: Smartphone,
};

export function ChannelSelector({ channelsEnabled, onToggle }: ChannelSelectorProps) {
  const channels: NotificationChannel[] = ['in_app', 'email', 'push'];

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
        Channels
      </h4>
      <div className="grid grid-cols-3 gap-2">
        {channels.map((channel) => {
          const Icon = CHANNEL_ICONS[channel];
          const enabled = channelsEnabled[channel];

          return (
            <button
              key={channel}
              onClick={() => onToggle(channel)}
              className={`
                flex flex-col items-center gap-1.5 p-3 rounded-xl
                border transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-brand-500/50
                ${enabled
                  ? 'bg-brand-500/10 dark:bg-brand-500/20 border-brand-500/30 dark:border-brand-500/40'
                  : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                }
              `}
              title={CHANNEL_DESCRIPTIONS[channel]}
            >
              <Icon
                className={`h-5 w-5 ${
                  enabled
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-surface-400 dark:text-surface-500'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  enabled
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-surface-500 dark:text-surface-400'
                }`}
              >
                {CHANNEL_LABELS[channel]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ChannelSelector;
