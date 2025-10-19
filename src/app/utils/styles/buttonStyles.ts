import { StyleSheet } from 'react-native';
import { primaryColor, separatorColor, warningColor } from './colors';

/**
 * Shared button styles used across the application
 * Matches the Auth screens design for consistency
 * 
 * Usage:
 * <Button style={[buttonStyles.primary, isDisabled && buttonStyles.primaryDisabled]}>
 *   <ButtonText style={buttonStyles.primaryText}>Save</ButtonText>
 * </Button>
 */
export const buttonStyles = StyleSheet.create({
  // Primary action button (login, register, save, submit)
  primary: {
    backgroundColor: primaryColor,
    borderRadius: 12,
    height: 50,
    width: '100%',
  },
  primaryDisabled: {
    backgroundColor: separatorColor,
    opacity: 0.6,
  },
  primaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },

  // Secondary action button (cancel, back)
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: separatorColor,
    borderRadius: 12,
    height: 50,
    width: '100%',
  },
  secondaryText: {
    color: separatorColor,
    fontSize: 16,
    fontWeight: '600',
  },

  // Danger action button (delete, remove)
  danger: {
    backgroundColor: warningColor,
    borderRadius: 12,
    height: 50,
    width: '100%',
  },
  dangerText: {
    color: '#fff',
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

