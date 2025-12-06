import { StyleSheet } from 'react-native';
import { useThemeColors } from './themeColors';

/**
 * Shared button styles used across the application
 * Matches the Auth screens design for consistency
 * 
 * Usage:
 * const colors = useThemeColors();
 * const styles = getButtonStyles(colors);
 * <Button style={[styles.primary, isDisabled && styles.primaryDisabled]}>
 *   <ButtonText style={styles.primaryText}>Save</ButtonText>
 * </Button>
 */

export const getButtonStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  // Primary action button (login, register, save, submit)
  primary: {
    backgroundColor: colors.primaryColor,
    borderRadius: 12,
    height: 50,
    width: '100%',
  },
  primaryDisabled: {
    backgroundColor: colors.separatorColor,
    opacity: 0.6,
  },
  primaryText: {
    color: colors.primaryBgColor,
    fontSize: 16,
    fontWeight: '700',
  },

  // Secondary action button (cancel, back)
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.separatorColor,
    borderRadius: 12,
    height: 50,
    width: '100%',
  },
  secondaryText: {
    color: colors.separatorColor,
    fontSize: 16,
    fontWeight: '600',
  },

  // Danger action button (delete, remove)
  danger: {
    backgroundColor: colors.warningColor,
    borderRadius: 12,
    height: 50,
    width: '100%',
  },
  dangerText: {
    color: colors.primaryBgColor,
    fontSize: 16,
    fontWeight: '700',
  },

  // Small variant (for inline actions)
  small: {
    height: 40,
    paddingHorizontal: 16,
    width: 'auto',
  },
  smallText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// Legacy export for backward compatibility - uses static colors (dark theme)
export const buttonStyles = StyleSheet.create({
  // Primary action button (login, register, save, submit)
  primary: {
    backgroundColor: '#10D9B9', // primaryColor
    borderRadius: 12,
    height: 50,
    width: '100%',
  },
  primaryDisabled: {
    backgroundColor: '#6c6b6b', // separatorColor
    opacity: 0.6,
  },
  primaryText: {
    color: '#020213', // primaryBgColor (dark theme)
    fontSize: 16,
    fontWeight: '700',
  },

  // Secondary action button (cancel, back)
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#6c6b6b', // separatorColor
    borderRadius: 12,
    height: 50,
    width: '100%',
  },
  secondaryText: {
    color: '#6c6b6b', // separatorColor
    fontSize: 16,
    fontWeight: '600',
  },

  // Danger action button (delete, remove)
  danger: {
    backgroundColor: '#FE7878', // warningColor
    borderRadius: 12,
    height: 50,
    width: '100%',
  },
  dangerText: {
    color: '#020213', // primaryBgColor (dark theme)
    fontSize: 16,
    fontWeight: '700',
  },

  // Small variant (for inline actions)
  small: {
    height: 40,
    paddingHorizontal: 16,
    width: 'auto',
  },
  smallText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

