/**
 * Production Ad Configuration
 * 
 * Optimized for maximum ad fill rate and revenue in production
 */

export const AD_CONFIG = {
  // Production optimizations
  PRODUCTION: {
    // More aggressive ad frequency in production
    BASE_FREQUENCY: 2, // Show ad every 2 posts (vs 3 in dev)
    MIN_POSTS_FOR_ADS: 2, // Start showing ads after 2 posts
    MAX_ADS_PER_SESSION: 50, // Limit to prevent overwhelming users
    
    // Timing optimizations
    INITIAL_DELAY: 100, // Slightly longer for production stability
    RETRY_DELAYS: [1000, 3000, 8000], // Progressive delays for retries
    MAX_RETRY_ATTEMPTS: 5, // More retries in production
    
    // Rate limiting - more conservative in production
    MIN_TIME_BETWEEN_REQUESTS: 3000, // 3 seconds between requests
    MAX_CONCURRENT_REQUESTS: 3, // Conservative concurrent limit
    
    // No-fill mitigation
    NO_FILL_COOLDOWN: 30000, // 30 seconds cooldown after no-fill
    NO_FILL_MAX_ATTEMPTS: 3, // Max attempts before longer cooldown
    NO_FILL_EXTENDED_COOLDOWN: 300000, // 5 minutes extended cooldown
    
    // Performance thresholds
    MIN_SUCCESS_RATE: 20, // Lower threshold for production (20% vs 30%)
    SUCCESS_RATE_SAMPLE_SIZE: 10, // Evaluate after 10 attempts
    
    // Adaptive frequency
    HIGH_SUCCESS_FREQUENCY: 2, // Every 2 posts when success rate > 70%
    MEDIUM_SUCCESS_FREQUENCY: 3, // Every 3 posts when success rate 40-70%
    LOW_SUCCESS_FREQUENCY: 5, // Every 5 posts when success rate < 40%
  },
  
  // Development settings (more lenient)
  DEVELOPMENT: {
    BASE_FREQUENCY: 3,
    MIN_POSTS_FOR_ADS: 2,
    MAX_ADS_PER_SESSION: 20,
    
    INITIAL_DELAY: 50,
    RETRY_DELAYS: [500, 1500, 4000],
    MAX_RETRY_ATTEMPTS: 3,
    
    MIN_TIME_BETWEEN_REQUESTS: 500,
    MAX_CONCURRENT_REQUESTS: 6,
    
    NO_FILL_COOLDOWN: 5000,
    NO_FILL_MAX_ATTEMPTS: 2,
    NO_FILL_EXTENDED_COOLDOWN: 60000,
    
    MIN_SUCCESS_RATE: 0, // No threshold in dev
    SUCCESS_RATE_SAMPLE_SIZE: 5,
    
    HIGH_SUCCESS_FREQUENCY: 2,
    MEDIUM_SUCCESS_FREQUENCY: 3,
    LOW_SUCCESS_FREQUENCY: 4,
  },
} as const;

// Get current environment config
export const getCurrentAdConfig = () => {
  return __DEV__ ? AD_CONFIG.DEVELOPMENT : AD_CONFIG.PRODUCTION;
};

// Ad request options optimized for production
export const getAdRequestOptions = () => {
  const baseOptions = {
    requestNonPersonalizedAdsOnly: false, // Allow personalized ads in production
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  };
  
  if (__DEV__) {
    return {
      ...baseOptions,
      requestNonPersonalizedAdsOnly: true, // Non-personalized for testing
    };
  }
  
  return baseOptions;
};

// Mediation configuration for better fill rates
export const MEDIATION_CONFIG = {
  // Enable multiple ad networks for better fill
  ENABLE_MEDIATION: true,
  
  // Waterfall configuration
  WATERFALL_TIMEOUT: 10000, // 10 seconds total timeout
  NETWORK_TIMEOUT: 3000, // 3 seconds per network
  
  // Refresh strategies
  REFRESH_INTERVALS: {
    HIGH_TRAFFIC: 30000, // 30 seconds for high traffic areas
    NORMAL_TRAFFIC: 60000, // 1 minute for normal areas
    LOW_TRAFFIC: 120000, // 2 minutes for low traffic areas
  },
};

// Geographic and demographic targeting
export const TARGETING_CONFIG = {
  // Enable location-based targeting for better fill rates
  ENABLE_LOCATION_TARGETING: true,
  
  // Age and gender targeting (if available)
  ENABLE_DEMOGRAPHIC_TARGETING: true,
  
  // Interest-based targeting
  ENABLE_INTEREST_TARGETING: true,
  
  // Device targeting
  DEVICE_TARGETING: {
    ENABLE_DEVICE_TARGETING: true,
    TARGET_PREMIUM_DEVICES: true, // Higher CPM on premium devices
  },
};

export default getCurrentAdConfig();


