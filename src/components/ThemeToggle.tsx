import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        relative p-2.5 rounded-xl
        text-surface-500 dark:text-surface-400
        hover:text-surface-700 dark:hover:text-surface-200
        hover:bg-surface-100 dark:hover:bg-surface-800
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2
        dark:focus:ring-offset-surface-900
      "
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative h-5 w-5">
        {/* Sun icon */}
        <Sun
          className={`
            absolute inset-0 h-5 w-5
            transition-all duration-300
            ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
        />
        {/* Moon icon */}
        <Moon
          className={`
            absolute inset-0 h-5 w-5
            transition-all duration-300
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
          `}
        />
      </div>
    </button>
  );
}
