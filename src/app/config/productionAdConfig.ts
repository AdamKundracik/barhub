/**
 * Production Ad Configuration
 * 
 * Optimized for maximum revenue and fill rate in production
 */

export const PRODUCTION_AD_CONFIG = {
  // Ad frequency - more aggressive in production
  FREQUENCY: {
    BASE_FREQUENCY: 2, // Show ad every 2 posts (vs 3 in dev)
    MIN_POSTS_FOR_ADS: 1, // Start showing ads after 1st post
    SMALL_FEED_THRESHOLD: 5, // Feeds with less than 5 posts
    LARGE_FEED_THRESHOLD: 20, // Feeds with more than 20 posts
  },
  
  // Timing optimizations
  TIMING: {
    INITIAL_DELAY: 200, // Slightly longer for production stability
    RETRY_DELAYS: [2000, 5000, 10000], // Progressive retry delays
    MAX_RETRY_ATTEMPTS: 3,
    MIN_TIME_BETWEEN_REQUESTS: 1500, // Reduced from 3s to 1.5s for better fill
    MAX_CONCURRENT_REQUESTS: 3, // Increased from 2 to 3 for better throughput
  },
  
  // AdMob request optimization
  REQUEST_OPTIONS: {
    // Enable personalized ads in production for better CPM
    requestNonPersonalizedAdsOnly: false,
    
    // Targeting options for better fill rates
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
    
    // Additional targeting (if supported)
    keywords: ['social', 'entertainment', 'lifestyle'],
    contentUrl: undefined, // Can be set to app's content URL
  },
  
  // Error handling
  ERROR_HANDLING: {
    // Retryable error patterns
    RETRYABLE_PATTERNS: [
      'network', 'timeout', 'connection', 'unavailable',
      'internal_error', 'network_error', 'no_fill'
    ],
    
    // Cooldown periods
    NO_FILL_COOLDOWN: 30000, // 30 seconds after no-fill
    ERROR_COOLDOWN: 10000, // 10 seconds after other errors
  },
  
  // Performance optimization
  PERFORMANCE: {
    // Preload settings
    ENABLE_PRELOADING: false, // Keep it simple
    
    // Memory management
    MAX_CACHED_ADS: 0, // No caching for simplicity
    
    // Rendering optimization
    LAZY_LOADING: true,
    VIEWPORT_BUFFER: 2, // Load ads 2 screens ahead
  },
} as const;

// Get ad request options based on environment
export const getAdRequestOptions = () => {
  if (__DEV__) {
    return {
      requestNonPersonalizedAdsOnly: true, // Non-personalized for testing
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    };
  }
  
  return PRODUCTION_AD_CONFIG.REQUEST_OPTIONS;
};

// Get timing configuration based on environment
export const getTimingConfig = () => {
  if (__DEV__) {
    return {
      INITIAL_DELAY: 100,
      RETRY_DELAYS: [1000, 3000, 6000],
      MAX_RETRY_ATTEMPTS: 2,
      MIN_TIME_BETWEEN_REQUESTS: 1000,
      MAX_CONCURRENT_REQUESTS: 4,
    };
  }
  
  return PRODUCTION_AD_CONFIG.TIMING;
};

// Get frequency configuration based on environment
export const getFrequencyConfig = () => {
  if (__DEV__) {
    return {
      BASE_FREQUENCY: 3,
      MIN_POSTS_FOR_ADS: 2,
    };
  }
  
  return PRODUCTION_AD_CONFIG.FREQUENCY;
};

export default PRODUCTION_AD_CONFIG;


