/**
 * Universal Color System
 *
 * This file provides color constants that can be used throughout the application.
 * Colors automatically adapt to the current theme (light/dark mode).
 *
 * Usage:
 * - For React components: Use useThemeColors() hook for reactive colors
 * - For StyleSheet.create(): Use the exported constants directly (they will use current theme)
 * - For static contexts: Use getThemeColors() helper
 */

import { useThemeStore } from '../store/themeStore';

// Helper to get current theme mode
const getCurrentTheme = (): 'light' | 'dark' => {
  try {
    return useThemeStore.getState().mode || 'dark';
  } catch {
    return 'dark'; // Default fallback
  }
};

// Brand colors (same in both themes)
export const primaryColor = '#10D9B9';
export const primaryDeepColor = '#254E48';
export const warningColor = '#FE7878';
export const successColor = 'rgba(76, 175, 80, 0.8)';

// Theme-aware color getters
// These functions return the correct color based on current theme
export const getPrimaryBgColor = (): string => {
  return getCurrentTheme() === 'dark' ? '#020213' : '#FFFFFF';
};

export const getPrimaryTextColor = (): string => {
  return getCurrentTheme() === 'dark' ? '#FFFFFF' : '#000000';
};

export const getSecondaryTextColor = (): string => {
  return getCurrentTheme() === 'dark' ? '#6c6b6b' : '#4A4A4A';
};

export const getPostBgColor = (): string => {
  return getCurrentTheme() === 'dark' ? '#03031C' : '#EEEEEE';
};

export const getPrimaryGrey = (): string => {
  return getCurrentTheme() === 'dark' ? '#031824' : '#E0E0E0';
};

export const getPrimaryLightGrey = (): string => {
  return getCurrentTheme() === 'dark' ? '#B7B7B7' : '#888888';
};

export const getSeparatorColor = (): string => {
  return getCurrentTheme() === 'dark' ? '#7C7C7C' : '#D0D0D0';
};

export const getBottomModalBgColor = (): string => {
  return getCurrentTheme() === 'dark'
    ? 'rgba(20,27,34,0.8)'
    : 'rgba(255,255,255,0.95)';
};

export const getTextInputPlaceholderColor = (): string => {
  return getCurrentTheme() === 'dark' ? '#CFCACA' : '#999999';
};

export const getShadowColor = (): string => {
  return getCurrentTheme() === 'dark' ? '#000000' : 'rgba(0,0,0,0.1)';
};

export const getShadowColorLight = (): string => {
  return getCurrentTheme() === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
};

// Static color constants for backward compatibility
// These use dark theme as default (matching original design)
// NOTE: For theme-aware colors, use the getter functions above or useThemeColors() hook
export const primaryBgColor = '#020213'; // Default: dark theme
export const primaryTextColor = '#FFFFFF'; // Default: dark theme
export const secondaryTextColor = '#6c6b6b'; // Default: dark theme (updated for better readability)
export const primaryGrey = '#031824'; // Default: dark theme
export const primaryLightGrey = '#B7B7B7'; // Default: dark theme
export const separatorColor = '#7C7C7C'; // Default: dark theme
export const postBgColor = '#03031C'; // Default: dark theme
export const bottomModalBgColor = 'rgba(20,27,34,0.8)'; // Default: dark theme
export const textInputPlaceholderColor = '#CFCACA'; // Default: dark theme

// Re-export from themeColors for convenience
export { useThemeColors, getThemeColors } from './themeColors';

// Color object that can be imported and used directly
// This provides a simple way to access all colors
export const Colors = {
  // Brand colors (theme-independent)
  primary: primaryColor,
  primaryDeep: primaryDeepColor,
  warning: warningColor,
  success: successColor,

  // Theme-aware getters
  get primaryBg() {
    return getPrimaryBgColor();
  },
  get primaryText() {
    return getPrimaryTextColor();
  },
  get secondaryText() {
    return getSecondaryTextColor();
  },
  get postBg() {
    return getPostBgColor();
  },
  get grey() {
    return getPrimaryGrey();
  },
  get lightGrey() {
    return getPrimaryLightGrey();
  },
  get separator() {
    return getSeparatorColor();
  },
  get modalBg() {
    return getBottomModalBgColor();
  },
  get placeholder() {
    return getTextInputPlaceholderColor();
  },
  get shadow() {
    return getShadowColor();
  },
  get shadowLight() {
    return getShadowColorLight();
  },

  // Static values (dark theme default)
  primaryBgStatic: primaryBgColor,
  primaryTextStatic: primaryTextColor,
  secondaryTextStatic: secondaryTextColor,
  primaryGreyStatic: primaryGrey,
  primaryLightGreyStatic: primaryLightGrey,
  separatorStatic: separatorColor,
  postBgStatic: postBgColor,
  bottomModalBgStatic: bottomModalBgColor,
  placeholderStatic: textInputPlaceholderColor,
} as const;
