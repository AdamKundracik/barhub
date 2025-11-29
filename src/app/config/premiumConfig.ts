/**
 * Premium Configuration
 *
 * This file controls premium features throughout the app.
 * Change PREMIUM_ENABLED to true to restore premium functionality.
 */

export const PREMIUM_CONFIG = {
  // Master switch for premium features
  PREMIUM_ENABLED: false,

  // Individual feature controls
  FEATURES: {
    // Whether to show premium UI elements (borders, badges, etc.)
    SHOW_PREMIUM_UI: false,

    // Whether to gate features behind premium
    GATE_FAKE_LOCATION: true,

    // Whether to hide ads for premium users
    HIDE_ADS_FOR_PREMIUM: true,

    // Whether to show subscription screens and buttons
    SHOW_SUBSCRIPTION_UI: true,
  },

  // UI Controls
  UI: {
    // Show premium borders around avatars
    SHOW_PREMIUM_BORDERS: false,

    // Show premium badges in profiles
    SHOW_PREMIUM_BADGES: false,

    // Show subscription button in top bar
    SHOW_SUBSCRIPTION_BUTTON: false,
  },

  // Ad Controls
  ADS: {
    // Show ads to all users regardless of premium status
    ALWAYS_SHOW_ADS: true,

    // Respect premium status for ad hiding (only works if ALWAYS_SHOW_ADS is false)
    RESPECT_PREMIUM_FOR_ADS: false,
  },
} as const;

/**
 * Helper functions for easier usage throughout the app
 */
export const PremiumHelpers = {
  // Check if premium features are enabled
  isPremiumEnabled: () => PREMIUM_CONFIG.PREMIUM_ENABLED,

  // Check if user should see premium UI
  shouldShowPremiumUI: () =>
    PREMIUM_CONFIG.PREMIUM_ENABLED && PREMIUM_CONFIG.FEATURES.SHOW_PREMIUM_UI,

  // Check if fake location should be gated
  shouldGateFakeLocation: () =>
    PREMIUM_CONFIG.PREMIUM_ENABLED &&
    PREMIUM_CONFIG.FEATURES.GATE_FAKE_LOCATION,

  // Check if ads should be hidden for premium users
  shouldHideAdsForPremium: () =>
    PREMIUM_CONFIG.PREMIUM_ENABLED &&
    PREMIUM_CONFIG.FEATURES.HIDE_ADS_FOR_PREMIUM,

  // Check if subscription UI should be shown
  shouldShowSubscriptionUI: () =>
    PREMIUM_CONFIG.PREMIUM_ENABLED &&
    PREMIUM_CONFIG.FEATURES.SHOW_SUBSCRIPTION_UI,

  // Check if premium borders should be shown
  shouldShowPremiumBorders: () =>
    PREMIUM_CONFIG.PREMIUM_ENABLED && PREMIUM_CONFIG.UI.SHOW_PREMIUM_BORDERS,

  // Check if premium badges should be shown
  shouldShowPremiumBadges: () =>
    PREMIUM_CONFIG.PREMIUM_ENABLED && PREMIUM_CONFIG.UI.SHOW_PREMIUM_BADGES,

  // Check if subscription button should be shown
  shouldShowSubscriptionButton: () =>
    PREMIUM_CONFIG.PREMIUM_ENABLED &&
    PREMIUM_CONFIG.UI.SHOW_SUBSCRIPTION_BUTTON,

  // Check if ads should always be shown
  shouldAlwaysShowAds: () => PREMIUM_CONFIG.ADS.ALWAYS_SHOW_ADS,

  // Check if premium status should affect ad visibility
  shouldRespectPremiumForAds: () =>
    PREMIUM_CONFIG.PREMIUM_ENABLED &&
    PREMIUM_CONFIG.ADS.RESPECT_PREMIUM_FOR_ADS,
};

