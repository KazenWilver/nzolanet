import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'nzolanet_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly darkMode = signal(false);

  readonly isDarkMode = this.darkMode.asReadonly();

  initTheme(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    const isDark = saved === 'dark';
    this.applyTheme(isDark);
  }

  toggleTheme(): void {
    this.applyTheme(!this.darkMode());
  }

  setDarkMode(isDark: boolean): void {
    this.applyTheme(isDark);
  }

  private applyTheme(isDark: boolean): void {
    this.darkMode.set(isDark);
    document.body.classList.toggle('light-theme', !isDark);
    document.body.classList.toggle('dark-theme', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }
}