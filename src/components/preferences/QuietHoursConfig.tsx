import { Moon } from 'lucide-react';

interface QuietHoursConfigProps {
  enabled: boolean;
  startTime: string;
  endTime: string;
  onToggle: (enabled: boolean) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
}

export function QuietHoursConfig({
  enabled,
  startTime,
  endTime,
  onToggle,
  onStartTimeChange,
  onEndTimeChange,
}: QuietHoursConfigProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon
            className={`h-4 w-4 ${
              enabled
                ? 'text-brand-500 dark:text-brand-400'
                : 'text-surface-400 dark:text-surface-500'
            }`}
          />
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
            Quiet Hours
          </span>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => onToggle(!enabled)}
          className={`
            relative inline-flex h-5 w-9 items-center rounded-full
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2
            dark:focus:ring-offset-surface-900
            ${enabled
              ? 'bg-brand-500'
              : 'bg-surface-300 dark:bg-surface-600'
            }
          `}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`
              inline-block h-4 w-4 rounded-full bg-white shadow-sm
              transform transition-transform duration-200
              ${enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}
            `}
          />
        </button>
      </div>

      {/* Time Pickers */}
      {enabled && (
        <div className="pl-6 animate-fade-in">
          <div className="flex items-center gap-2 text-sm">
            <input
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="
                px-2 py-1 rounded-md
                bg-surface-100 dark:bg-surface-800
                border border-surface-200 dark:border-surface-700
                text-surface-700 dark:text-surface-300
                text-xs
                focus:outline-none focus:ring-2 focus:ring-brand-500/50
              "
            />
            <span className="text-surface-400 dark:text-surface-500">to</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="
                px-2 py-1 rounded-md
                bg-surface-100 dark:bg-surface-800
                border border-surface-200 dark:border-surface-700
                text-surface-700 dark:text-surface-300
                text-xs
                focus:outline-none focus:ring-2 focus:ring-brand-500/50
              "
            />
          </div>
          <p className="mt-2 text-xs text-surface-400 dark:text-surface-500">
            Notifications will be silenced during these hours
          </p>
        </div>
      )}
    </div>
  );
}

export default QuietHoursConfig;
