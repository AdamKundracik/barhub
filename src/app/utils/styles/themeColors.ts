import { useTheme } from '../hooks/useTheme';

/**
 * Theme-aware color values
 * These colors automatically adapt based on the current theme mode
 */
export const useThemeColors = () => {
  const { isDark, isLight } = useTheme();

  // Brand colors - same in both themes
  const brandPrimary = '#10D9B9';
  const brandPrimaryDeep = '#254E48';

  return {
    // Brand colors (consistent across themes)
    primaryColor: brandPrimary,
    primaryDeepColor: brandPrimaryDeep,

    // Background colors
    primaryBgColor: isDark ? '#020213' : '#FFFFFF',
    postBgColor: isDark ? '#03031C' : '#EEEEEE',
    bottomModalBgColor: isDark
      ? 'rgba(20,27,34,0.8)'
      : 'rgba(255,255,255,0.95)',

    // Text colors
    primaryTextColor: isDark ? '#FFFFFF' : '#000000',
    secondaryTextColor: isDark ? '#6c6b6b' : '#4A4A4A',
    textInputPlaceholderColor: isDark ? '#CFCACA' : '#999999',

    // Other colors
    primaryGrey: isDark ? '#031824' : '#E0E0E0',
    primaryLightGrey: isDark ? '#B7B7B7' : '#888888',
    separatorColor: isDark ? '#7C7C7C' : '#D0D0D0',
    
    // Shadow colors (for elevation and depth)
    shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.1)',
    shadowColorLight: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    warningColor: '#FE7878',
    successColor: isDark
      ? 'rgba(76, 175, 80, 0.8)'
      : 'rgba(76, 175, 80, 1)',

    // Theme mode indicators
    isDark,
    isLight,
  };
};

/**
 * Static theme color getter (for use outside of React components)
 * @param isDark - Whether dark mode is active
 */
export const getThemeColors = (isDark: boolean) => {
  const brandPrimary = '#10D9B9';
  const brandPrimaryDeep = '#254E48';

  return {
    primaryColor: brandPrimary,
    primaryDeepColor: brandPrimaryDeep,
    primaryBgColor: isDark ? '#020213' : '#FFFFFF',
    postBgColor: isDark ? '#03031C' : '#EEEEEE',
    bottomModalBgColor: isDark
      ? 'rgba(20,27,34,0.8)'
      : 'rgba(255,255,255,0.95)',
    primaryTextColor: isDark ? '#FFFFFF' : '#000000',
    secondaryTextColor: isDark ? '#6c6b6b' : '#4A4A4A',
    textInputPlaceholderColor: isDark ? '#CFCACA' : '#999999',
    primaryGrey: isDark ? '#031824' : '#E0E0E0',
    primaryLightGrey: isDark ? '#B7B7B7' : '#888888',
    separatorColor: isDark ? '#7C7C7C' : '#D0D0D0',
    shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.1)',
    shadowColorLight: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    warningColor: '#FE7878',
    successColor: isDark
      ? 'rgba(76, 175, 80, 0.8)'
      : 'rgba(76, 175, 80, 1)',
  };
};
