import { StyleSheet } from 'react-native';
import { primaryBgColor, primaryColor, secondaryTextColor } from './colors';

export const formStyles = StyleSheet.create({
  inputPrimary: {
    height: 50,
    marginBottom: 12,
    padding: 15,
    backgroundColor: primaryBgColor,
    borderRadius: 20,
    borderColor: primaryColor,
    borderWidth: 1,
    color: secondaryTextColor,
  },
  buttonPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 10,
    height: 50,
    alignSelf: 'center',
    width: 200,
    backgroundColor: primaryColor,
  },
  buttonSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 30,
    height: 40,
    alignSelf: 'center',
    width: '80%',
    backgroundColor: 'black',
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
    color: secondaryTextColor,
    display: 'flex',
    margin: 'auto',
    fontWeight: 'bold',
    fontSize: 20,
  },
});

export const commonAppStyles = StyleSheet.create({
  textPrimary: {
    color: primaryColor,
  },
  textSecondary: {
    color: secondaryTextColor,
  },
});

export const authPageStyles = StyleSheet.create({
  authPageContainer: {
    padding: 10,
    height: '100%',
    justifyContent: 'center',
  },
});
