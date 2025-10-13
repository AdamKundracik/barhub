/**
 * Social Authentication Configuration
 * 
 * Google OAuth Setup:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable Google+ API
 * 4. Create OAuth 2.0 credentials for:
 *    - iOS (iOS Client ID)
 *    - Android (Android Client ID)
 *    - Web (Web Client ID for Expo)
 * 5. Replace the placeholder values below
 * 
 * Apple Sign-In Setup:
 * 1. Apple Developer Account required
 * 2. Enable Sign in with Apple capability in Xcode
 * 3. Add com.apple.developer.applesignin entitlement
 * 4. No additional config needed (handled by Expo)
 */

export const GOOGLE_OAUTH_CONFIG = {
  // Expo Client ID (for development/Expo Go) - can be same as Web Client ID
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  
  // iOS Client ID (for standalone iOS app)
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  
  // Web Client ID (backend verification)
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
};


/**
 * Check if social auth is properly configured
 */
export const isSocialAuthConfigured = {
  google: () => {
    return !GOOGLE_OAUTH_CONFIG.iosClientId.includes('YOUR_') && 
           !GOOGLE_OAUTH_CONFIG.webClientId.includes('YOUR_');
  },
  apple: () => {
    // Apple Sign-In doesn't require client-side config
    return true;
  },
};

