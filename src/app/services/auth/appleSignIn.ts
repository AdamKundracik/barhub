import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export interface AppleSignInResult {
  idToken: string;
  email?: string;
  name: string;
  appleUserId: string;
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
    const { identityToken, email, fullName, user } = credential;

    if (!identityToken) {
      throw new Error('No identity token received from Apple');
    }

    if (!user) {
      throw new Error('No Apple User ID received from Apple');
    }

    // Construct full name (Apple only provides this on first sign-in)
    const name = fullName
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
      : 'Apple User'; // Fallback name

    const result = {
      idToken: identityToken,
      email: email || undefined, // Convert null to undefined for existing users
      name: name || 'Apple User',
      appleUserId: user, // Apple User ID
    };

    console.log('[Apple Sign-In] Parsed result:', {
      idToken: result.idToken.substring(0, 20) + '...',
      email: result.email || 'No email (existing user)',
      name: result.name,
      appleUserId: result.appleUserId,
    });

    return result;
  } catch (error: any) {
    if (error.code === 'ERR_CANCELED') {
      console.log('Apple Sign-In was canceled by user');
      return null;
    }

    console.error('Apple Sign-In error:', error);
    throw new Error(error?.message || 'Apple Sign-In failed');
  }
};
