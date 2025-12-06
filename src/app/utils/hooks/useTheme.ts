import { useThemeStore } from '../store/themeStore';

/**
 * Hook to access and control theme
 * @returns {Object} Theme state and controls
 */
export const useTheme = () => {
  const { mode, setMode, toggleMode } = useThemeStore();

  return {
    mode,
    setMode,
    toggleMode,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  };
};
