import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useThemeColors } from '../styles/themeColors';

/**
 * Hook to create theme-aware styles
 * Styles will automatically update when theme changes
 *
 * Usage:
 * ```typescript
 * const styles = useThemedStyles((colors) => ({
 *   container: {
 *     backgroundColor: colors.primaryBgColor,
 *   },
 *   text: {
 *     color: colors.primaryTextColor,
 *   },
 * }));
 * ```
 */
export const useThemedStyles = <T extends Record<string, any>>(
  styleFactory: (colors: ReturnType<typeof useThemeColors>) => T
) => {
  const colors = useThemeColors();

  return useMemo(() => {
    return StyleSheet.create(styleFactory(colors));
  }, [colors, styleFactory]);
};
