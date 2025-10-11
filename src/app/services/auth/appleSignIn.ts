import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export interface AppleSignInResult {
  idToken: string;
  email: string;
  name: string;
}

/**
 * Check if Apple Sign-In is available
 * Only available on iOS 13+
 */
export const isAppleSignInAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    console.error('Error checking Apple Sign-In availability:', error);
    return false;
  }
};

/**
 * Sign in with Apple
 * Returns user info and identity token
 */
export const signInWithApple = async (): Promise<AppleSignInResult | null> => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Extract user info
    const { identityToken, email, fullName } = credential;

    if (!identityToken) {
      throw new Error('No identity token received from Apple');
    }

    if (!email) {
      throw new Error('No email received from Apple');
    }

    // Construct full name (Apple only provides this on first sign-in)
    const name = fullName
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
      : email.split('@')[0]; // Fallback to email username

    return {
      idToken: identityToken,
      email: email,
      name: name || 'User',
    };
  } catch (error: any) {
    if (error.code === 'ERR_CANCELED') {
      console.log('Apple Sign-In was canceled by user');
      return null;
    }

    console.error('Apple Sign-In error:', error);
    throw new Error(error?.message || 'Apple Sign-In failed');
  }
};

