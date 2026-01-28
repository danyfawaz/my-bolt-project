import { Volume2, VolumeX } from 'lucide-react';

interface SoundToggleProps {
  enabled: boolean;
  volume: number;
  onToggle: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
}

export function SoundToggle({
  enabled,
  volume,
  onToggle,
  onVolumeChange,
}: SoundToggleProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {enabled ? (
            <Volume2 className="h-4 w-4 text-brand-500 dark:text-brand-400" />
          ) : (
            <VolumeX className="h-4 w-4 text-surface-400 dark:text-surface-500" />
          )}
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
            Sound
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

      {/* Volume Slider */}
      {enabled && (
        <div className="pl-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-xs text-surface-500 dark:text-surface-400 w-14">
              Volume
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
              className="
                flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                bg-surface-200 dark:bg-surface-700
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-brand-500
                [&::-webkit-slider-thumb]:shadow-sm
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-3.5
                [&::-moz-range-thumb]:h-3.5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-brand-500
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-sm
                [&::-moz-range-thumb]:cursor-pointer
              "
            />
            <span className="text-xs text-surface-500 dark:text-surface-400 w-8 text-right">
              {volume}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SoundToggle;
