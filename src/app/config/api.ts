import { getCurrentEnvConfig } from './environment';

// API Configuration
export const API_CONFIG = {
  // Base URL from environment
  BASE_URL: getCurrentEnvConfig().API_BASE_URL,
  
  // Timeout settings
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // Token refresh settings
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
};

// Endpoints
export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/password/forgot',
    RESET_PASSWORD: '/auth/password/reset',
    UPDATE_PASSWORD: '/auth/password/update',
    SEND_VERIFICATION_EMAIL: '/auth/email/send-verification',
    RESEND_VERIFICATION_EMAIL: '/auth/email/resend-verification',
    VERIFY_EMAIL: '/auth/email/verify',
    VALIDATE_EMAIL_TOKEN: '/auth/email/validate',
  },
  
  // User endpoints
  USERS: {
    ME: '/users/me',
    DELETE_ME: '/users/me',
    BY_ID: (id: string) => `/users/${id}`,
    PUSH_TOKENS: (id: string) => `/users/${id}/push-tokens`,
    LOCATION: (id: string) => `/users/${id}/update-location`,
    SEARCH_HISTORY: (id: string) => `/users/${id}/search-history`,
  },
  
  // Post endpoints
  POSTS: {
    BASE: '/posts',
    BY_ID: (id: string) => `/posts/${id}`,
    LIKE: (id: string) => `/posts/${id}/like`,
    LIKES_COUNT: (id: string) => `/posts/${id}/likes/count`,
    FRESH_CONTENT: '/posts/fresh-content',
    BY_PLACE: '/posts/place',
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    BASE: '/notifications',
    BY_USER: (userId: string) => `/notifications/user/${userId}`,
    HAS_NEW: (userId: string) => `/notifications/user/${userId}/has-new`,
    COUNT: (userId: string) => `/notifications/user/${userId}/count`,
  },
  
  // Leaderboard endpoints
  LEADERBOARDS: {
    BASE: '/leaderboards',
    BY_ID: (id: string) => `/leaderboards/${id}`,
    BY_TYPE: (type: string) => `/leaderboards/type/${type}`,
    TOP_100: (type: string, userId: string) => `/leaderboards/type/${type}/top100?currentUserId=${userId}`,
    BY_CLIENT: (clientId: string) => `/leaderboards/client/${clientId}`,
  },
  
  // Report endpoints
  REPORTS: {
    BASE: '/reports',
    BY_ID: (id: string) => `/reports/${id}`,
    BY_TYPE: (type: string) => `/reports/type/${type}`,
  },
};
