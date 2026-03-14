"use client";

import { Moon, Sun, Shield } from "lucide-react";
import { useTheme } from "./theme-provider";

export function Header() {
  const { isDark, toggle } = useTheme();

  return (
    <header className="fixed top-0 z-50 w-full h-16 flex items-center justify-between px-6 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
          KYD
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
          Know Your Director
        </span>
      </div>

      <button
        onClick={toggle}
        className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
}
