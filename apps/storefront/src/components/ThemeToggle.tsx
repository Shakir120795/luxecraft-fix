'use client';

import { useEffect, useState } from 'react';

const THEME_KEY = 'luxecraft-theme';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    const shouldUseDark = savedTheme === 'dark' || (
      !savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches
    );
    document.documentElement.classList.toggle('dark', shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    document.documentElement.classList.toggle('dark', nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme ? 'dark' : 'light');
    setIsDark(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center border border-luxury-sand text-luxury-charcoal transition-colors hover:border-luxury-gold hover:text-luxury-gold"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span aria-hidden="true" className="text-base">{isDark ? '☀' : '◐'}</span>
    </button>
  );
}
