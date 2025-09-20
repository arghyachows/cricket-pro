'use client';

import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggler() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Sun Icon */}
      <Sun
        className={`h-5 w-5 transition-all duration-500 ease-in-out ${
          theme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        }`}
      />

      {/* Moon Icon */}
      <Moon
        className={`absolute h-5 w-5 transition-all duration-500 ease-in-out ${
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />

      {/* Background animation */}
      <div
        className={`absolute inset-0 rounded-md transition-colors duration-300 ${
          theme === 'light'
            ? 'bg-gradient-to-br from-yellow-100 to-orange-100'
            : 'bg-gradient-to-br from-slate-700 to-slate-900'
        }`}
        style={{ opacity: 0.1 }}
      />
    </Button>
  );
}
