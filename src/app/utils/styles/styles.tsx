import { StyleSheet } from 'react-native';
import {
  primaryBgColor,
  primaryColor,
  primaryDeepColor,
  primaryGrey,
  primaryTextColor,
} from './colors';
import { useThemeColors } from './themeColors';

// Theme-aware form styles function
export const getFormStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    inputPrimary: {
      paddingHorizontal: 10,
      backgroundColor: colors.primaryTextColor + '0D', // 5% opacity
      borderColor: colors.separatorColor,
      borderWidth: 1,
      color: colors.primaryTextColor,
    },
    inputPrimaryFocused: {
      paddingHorizontal: 10,
      backgroundColor: colors.primaryTextColor + '0D',
      borderColor: colors.primaryColor,
      borderWidth: 2,
      color: colors.primaryTextColor,
    },
  });

// Static form styles for backward compatibility
export const formStyles = StyleSheet.create({
  inputPrimary: {
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF0D', // Static fallback
    borderColor: '#6c6b6b', // Static fallback
    borderWidth: 1,
    color: '#FFFFFF', // Static fallback
  },
  inputPrimaryFocused: {
    paddingHorizontal: 10,
    backgroundColor: primaryGrey,
    borderColor: primaryDeepColor,
    borderWidth: 1,
    color: primaryTextColor,
  },
  formControl: {
    marginBottom: 10,
  },
  buttonPrimary: {
    marginTop: 10,
    borderRadius: 10,
    height: 50,
    width: '100%',
    minWidth: 250,
    backgroundColor: primaryColor,
  },
  buttonSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: 50,
    alignSelf: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: primaryColor,
    backgroundColor: primaryBgColor,
  },
  buttonPrimaryDisabled: {
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 30,
    height: 40,
    alignSelf: 'center',
    width: '80%',
    backgroundColor: '#6c6c72',
  },
  buttonTextDisabled: {
    display: 'flex',
    margin: 'auto',
    fontWeight: 'bold',
    fontSize: 20,
    color: 'rgb(27,34,40)',
  },
  buttonText: {
    color: primaryGrey,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export const commonAppStyles = StyleSheet.create({
  textPrimary: {
    color: primaryColor,
  },
  textSecondary: {
    color: primaryTextColor,
  },
});

export const authPageStyles = StyleSheet.create({
  authPageContainer: {
    padding: 10,
    height: '100%',
    justifyContent: 'center',
  },
});
