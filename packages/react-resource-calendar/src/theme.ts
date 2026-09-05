import React, { createContext, useContext, useMemo } from 'react';

export interface GridEventThemeColors {
  bg: string;
  border: string;
  text: string;
  badgeBg?: string;
}

export interface GridPalette {
  /** Main outer container and root background */
  surface: string;
  /** Inactive headers, time gutter, subtle backgrounds */
  surfaceSubtle: string;
  /** Sticky date section headers & badge backgrounds */
  surfaceContainer: string;
  /** Individual column/cell background (usually pure white or dark card) */
  surfaceCard: string;
  /** Hover and active interactive slot background */
  surfaceHover: string;
  /** Standard grid dividing lines */
  border: string;
  /** Header dividers, section borders, badge outlines */
  borderStrong: string;
  /** Primary text, titles, headings */
  textPrimary: string;
  /** Secondary labels, time markers, column subtitles */
  textSecondary: string;
  /** Muted timestamps, subtle badges, metadata */
  textMuted: string;
  /** Primary brand accent, active tabs, focus rings */
  primary: string;
  /** Error, conflict indicators, and out-of-range warnings */
  error: string;
  /** Conflict warning background tint */
  errorBg: string;
}

export interface GridTheme {
  name: string;
  palette: GridPalette;
  eventThemes: Record<string, GridEventThemeColors>;
}

export type GridThemePresetName = 'default' | 'warm' | 'clinical' | 'dark';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type GridThemeInput = DeepPartial<GridTheme>;

/**
 * Default clean, reduced 6-role slate theme.
 */
export const defaultGridTheme: GridTheme = {
  name: 'default',
  palette: {
    surface: '#f8fafc',
    surfaceSubtle: '#f1f5f9',
    surfaceContainer: '#e2e8f0',
    surfaceCard: '#ffffff',
    surfaceHover: '#eff6ff',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    primary: '#2563eb',
    error: '#dc2626',
    errorBg: 'rgba(220, 38, 38, 0.08)',
  },
  eventThemes: {
    blue: {
      bg: 'rgba(37, 99, 235, 0.08)',
      border: '#2563eb',
      text: '#1e3a8a',
      badgeBg: 'rgba(37, 99, 235, 0.15)',
    },
    teal: {
      bg: 'rgba(13, 148, 136, 0.08)',
      border: '#0d9488',
      text: '#134e4a',
      badgeBg: 'rgba(13, 148, 136, 0.15)',
    },
    amber: {
      bg: 'rgba(217, 119, 6, 0.08)',
      border: '#d97706',
      text: '#78350f',
      badgeBg: 'rgba(217, 119, 6, 0.15)',
    },
    purple: {
      bg: 'rgba(147, 51, 234, 0.08)',
      border: '#9333ea',
      text: '#581c87',
      badgeBg: 'rgba(147, 51, 234, 0.15)',
    },
    rose: {
      bg: 'rgba(225, 29, 72, 0.08)',
      border: '#e11d48',
      text: '#881337',
      badgeBg: 'rgba(225, 29, 72, 0.15)',
    },
    emerald: {
      bg: 'rgba(22, 163, 74, 0.08)',
      border: '#16a34a',
      text: '#14532d',
      badgeBg: 'rgba(22, 163, 74, 0.15)',
    },
  },
};

/**
 * Built-in Preset Themes
 */
export const gridThemePresets: Record<'default' | 'warm' | 'dark' | 'clinical', GridTheme> = {
  default: defaultGridTheme,
  warm: {
    name: 'warm',
    palette: {
      surface: '#faf8f5',
      surfaceSubtle: '#f3efe8',
      surfaceContainer: '#e8e2d8',
      surfaceCard: '#ffffff',
      surfaceHover: '#fef3c7',
      border: '#e8e2d8',
      borderStrong: '#d5ccbe',
      textPrimary: '#292524',
      textSecondary: '#57534e',
      textMuted: '#78716c',
      primary: '#d97706',
      error: '#dc2626',
      errorBg: 'rgba(220, 38, 38, 0.08)',
    },
    eventThemes: defaultGridTheme.eventThemes,
  },
  clinical: {
    name: 'clinical',
    palette: {
      surface: '#f0fdfa',
      surfaceSubtle: '#ccfbf1',
      surfaceContainer: '#99f6e4',
      surfaceCard: '#ffffff',
      surfaceHover: '#e0f2fe',
      border: '#99f6e4',
      borderStrong: '#5eead4',
      textPrimary: '#134e4a',
      textSecondary: '#115e59',
      textMuted: '#0f766e',
      primary: '#0d9488',
      error: '#e11d48',
      errorBg: 'rgba(225, 29, 72, 0.08)',
    },
    eventThemes: defaultGridTheme.eventThemes,
  },
  dark: {
    name: 'dark',
    palette: {
      surface: '#0f172a',
      surfaceSubtle: '#1e293b',
      surfaceContainer: '#334155',
      surfaceCard: '#1e293b',
      surfaceHover: '#334155',
      border: '#334155',
      borderStrong: '#475569',
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      primary: '#38bdf8',
      error: '#f87171',
      errorBg: 'rgba(248, 113, 113, 0.15)',
    },
    eventThemes: {
      blue: {
        bg: 'rgba(56, 189, 248, 0.15)',
        border: '#38bdf8',
        text: '#e0f2fe',
        badgeBg: 'rgba(56, 189, 248, 0.25)',
      },
      teal: {
        bg: 'rgba(45, 212, 191, 0.15)',
        border: '#2dd4bf',
        text: '#ccfbf1',
        badgeBg: 'rgba(45, 212, 191, 0.25)',
      },
      amber: {
        bg: 'rgba(251, 191, 36, 0.15)',
        border: '#fbbf24',
        text: '#fef3c7',
        badgeBg: 'rgba(251, 191, 36, 0.25)',
      },
      purple: {
        bg: 'rgba(192, 132, 252, 0.15)',
        border: '#c084fc',
        text: '#f3e8ff',
        badgeBg: 'rgba(192, 132, 252, 0.25)',
      },
      rose: {
        bg: 'rgba(251, 113, 133, 0.15)',
        border: '#fb7185',
        text: '#ffe4e6',
        badgeBg: 'rgba(251, 113, 133, 0.25)',
      },
      emerald: {
        bg: 'rgba(74, 222, 128, 0.15)',
        border: '#4ade80',
        text: '#dcfce7',
        badgeBg: 'rgba(74, 222, 128, 0.25)',
      },
    },
  },
};

/**
 * Creates and merges a custom theme with the default grid theme.
 */
export function createGridTheme(customTheme?: GridThemeInput): GridTheme {
  if (!customTheme) return defaultGridTheme;

  const mergedEventThemes: Record<string, GridEventThemeColors> = {
    ...defaultGridTheme.eventThemes,
  };

  if (customTheme.eventThemes) {
    for (const [key, val] of Object.entries(customTheme.eventThemes)) {
      if (val) {
        const base = defaultGridTheme.eventThemes[key] || defaultGridTheme.eventThemes.blue;
        mergedEventThemes[key] = {
          bg: val.bg || base.bg,
          border: val.border || base.border,
          text: val.text || base.text,
          badgeBg: val.badgeBg || base.badgeBg,
        };
      }
    }
  }

  return {
    name: customTheme.name || 'custom',
    palette: {
      ...defaultGridTheme.palette,
      ...(customTheme.palette as Partial<GridPalette> | undefined),
    },
    eventThemes: mergedEventThemes,
  };
}

/**
 * Converts a theme into CSS custom variables for container-level injection.
 */
export function gridThemeToCSSVariables(theme: GridTheme): Record<string, string> {
  return {
    '--grid-surface': theme.palette.surface,
    '--grid-surface-subtle': theme.palette.surfaceSubtle,
    '--grid-surface-container': theme.palette.surfaceContainer,
    '--grid-surface-card': theme.palette.surfaceCard,
    '--grid-surface-hover': theme.palette.surfaceHover,
    '--grid-border': theme.palette.border,
    '--grid-border-strong': theme.palette.borderStrong,
    '--grid-text-primary': theme.palette.textPrimary,
    '--grid-text-secondary': theme.palette.textSecondary,
    '--grid-text-muted': theme.palette.textMuted,
    '--grid-primary': theme.palette.primary,
    '--grid-error': theme.palette.error,
    '--grid-error-bg': theme.palette.errorBg,
  };
}

/**
 * Resolves event theme colors for a given color key.
 */
export function resolveEventColors(
  themeName: string | undefined,
  theme: GridTheme
): GridEventThemeColors {
  const key = (themeName || 'blue').toLowerCase();
  return theme.eventThemes[key] || theme.eventThemes.blue || {
    bg: 'rgba(37, 99, 235, 0.08)',
    border: '#2563eb',
    text: '#1e3a8a',
  };
}

/**
 * React Context for theme distribution across the grid hierarchy.
 */
export const GridThemeContext = createContext<GridTheme>(defaultGridTheme);

export function useGridTheme(): GridTheme {
  return useContext(GridThemeContext);
}
