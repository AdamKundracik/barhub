// Environment Configuration
// API URL is loaded from .env files via EXPO_PUBLIC_API_URL
export const ENV = {
  // Development environment
  DEV: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_URL,
    DEBUG: true,
    LOG_LEVEL: 'debug',
  },

  // Production environment
  PROD: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_URL,
    DEBUG: false,
    LOG_LEVEL: 'error',
  },

  // Current environment
  CURRENT: __DEV__ ? 'DEV' : 'PROD',
};

// Get current environment config
export const getCurrentEnvConfig = () => {
  return ENV.CURRENT === 'DEV' ? ENV.DEV : ENV.PROD;
};

// Environment-specific logging
export const envLog = {
  debug: (message: string, ...args: any[]) => {
    if (getCurrentEnvConfig().DEBUG) {
      // console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    if (getCurrentEnvConfig().DEBUG) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
};
