import { StyleSheet } from 'react-native';
import {
  primaryBgColor,
  primaryColor,
  primaryDeepColor,
  primaryGrey,
  primaryTextColor,
} from './colors';

export const formStyles = StyleSheet.create({
  inputPrimary: {
    paddingHorizontal: 10,
    backgroundColor: primaryGrey,
    borderColor: primaryColor,
    borderWidth: 1,
    color: primaryTextColor,
  },
  inputPrimaryFocused: {
    paddingHorizontal: 10,
    backgroundColor: primaryGrey,
    borderColor: primaryDeepColor,
    borderWidth: 1,
    color: primaryTextColor,
  },
  formControl: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  buttonPrimary: {
    marginTop: 10,
    borderRadius: 10,
    height: 50,
    width: 200,
    backgroundColor: primaryColor,
  },
  buttonSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 10,
    height: 50,
    alignSelf: 'center',
    width: 200,
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
