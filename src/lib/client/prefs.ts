import { persistentJsonAtom } from './persistent';
import { STORAGE_KEYS } from './storage-keys';

export const PREF_OPTIONS = {
  theme: ['light', 'sepia', 'dark'],
  size: ['s', 'm', 'l'],
  measure: ['narrow', 'normal', 'wide'],
  font: ['serif', 'sans'],
} as const;

export type Prefs = { [K in keyof typeof PREF_OPTIONS]: (typeof PREF_OPTIONS)[K][number] };
export type Theme = Prefs['theme'];

export function defaultPrefs(prefersDark: boolean): Prefs {
  return { theme: prefersDark ? 'dark' : 'light', size: 'm', measure: 'normal', font: 'serif' };
}

function isOption<K extends keyof Prefs>(key: K, value: unknown): value is Prefs[K] {
  return (PREF_OPTIONS[key] as readonly unknown[]).includes(value);
}

/** Keeps every valid stored field and falls back per field, so one bad value loses nothing else. */
export function parsePrefs(raw: unknown, fallback: Prefs): Prefs {
  if (typeof raw !== 'object' || raw === null) return fallback;
  const stored = raw as Record<string, unknown>;
  return {
    theme: isOption('theme', stored.theme) ? stored.theme : fallback.theme,
    size: isOption('size', stored.size) ? stored.size : fallback.size,
    measure: isOption('measure', stored.measure) ? stored.measure : fallback.measure,
    font: isOption('font', stored.font) ? stored.font : fallback.font,
  };
}

export function nextTheme(theme: Theme): Theme {
  const themes = PREF_OPTIONS.theme;
  return themes[(themes.indexOf(theme) + 1) % themes.length] ?? 'light';
}

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export const $prefs = persistentJsonAtom<Prefs>(
  STORAGE_KEYS.prefs,
  defaultPrefs(systemPrefersDark()),
  parsePrefs,
);

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]): void {
  $prefs.set({ ...$prefs.get(), [key]: value });
}

export function cycleTheme(): void {
  setPref('theme', nextTheme($prefs.get().theme));
}

/** Mirrors the prefs onto <html> data attributes, which the stylesheets key off. */
export function applyPrefs(root: HTMLElement, prefs: Prefs): void {
  root.dataset.theme = prefs.theme;
  root.dataset.size = prefs.size;
  root.dataset.measure = prefs.measure;
  root.dataset.font = prefs.font;
}
