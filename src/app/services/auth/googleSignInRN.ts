import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_OAUTH_CONFIG } from '../../config/socialAuth';

export interface GoogleSignInResult {
  idToken: string;
  email: string;
  name: string;
  photoUrl?: string;
}

/**
 * Configure Google Sign-In
 */
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    iosClientId: GOOGLE_OAUTH_CONFIG.iosClientId,
    webClientId: GOOGLE_OAUTH_CONFIG.webClientId,
    offlineAccess: false,
    hostedDomain: '',
    forceCodeForRefreshToken: true,
  });
};

/**
 * Sign in with Google using React Native Google Sign-In
 */
export const signInWithGoogleRN = async (): Promise<GoogleSignInResult | null> => {
  try {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Configure Google Sign-In
    configureGoogleSignIn();
    
    // Sign in
    const result = await GoogleSignin.signIn();

    if (result.idToken && result.user) {
      const signInResult: GoogleSignInResult = {
        idToken: result.idToken,
        email: result.user.email,
        name: result.user.name || result.user.givenName || 'User',
        photoUrl: result.user.photo || undefined,
      };


      return signInResult;
    }

    throw new Error('No user data or ID token received');
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    } else if (error.code === statusCodes.IN_PROGRESS) {
      return null;
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return null;
    } else {
      throw error;
    }
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user is signed in
 * Uses getCurrentUser() to determine sign-in status
 */
export const isSignedIn = async (): Promise<boolean> => {
  try {
    const user = await GoogleSignin.getCurrentUser();
    return user !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    return await GoogleSignin.getCurrentUser();
  } catch (error) {
    return null;
  }
};
