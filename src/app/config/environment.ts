// Environment Configuration
export const ENV = {
  // Development environment
  DEV: {
    API_BASE_URL: 'http://192.168.1.225:8080/api',
    DEBUG: true,
    LOG_LEVEL: 'debug',
  },
  
  // Production environment
  PROD: {
    API_BASE_URL: 'https://your-production-backend.com/api', // Update this with your production URL
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
      console.log(`[DEBUG] ${message}`, ...args);
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
