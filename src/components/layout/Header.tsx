'use client';

import Link from 'next/link';
import { Wrench, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-blue-600">
          <Wrench className="h-5 w-5" />
          <span className="text-lg">AutoParts Finder</span>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-gray-600 dark:text-gray-300 sm:flex">
          <Link href="/search" className="hover:text-blue-600 dark:hover:text-blue-400">Search</Link>
          <Link href="/alerts" className="hover:text-blue-600 dark:hover:text-blue-400">Alerts</Link>
          <Link href="/garage" className="hover:text-blue-600 dark:hover:text-blue-400">Garage</Link>
          <Link href="/favorites" className="hover:text-blue-600 dark:hover:text-blue-400">Favorites</Link>
          <Link href="/pricing" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Upgrade</Link>
        </nav>
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}
      </div>
    </header>
  );
}
