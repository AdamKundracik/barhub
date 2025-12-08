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
    SIGNUP_WITH_PHOTO: '/auth/signup/with-photo',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/password/forgot',
    RESET_PASSWORD: '/auth/password/reset',
    UPDATE_PASSWORD: '/auth/password/update',
    SEND_VERIFICATION_EMAIL: '/auth/email/send-verification',
    RESEND_VERIFICATION_EMAIL: '/auth/email/resend-verification',
    VERIFY_EMAIL: '/auth/email/verify',
    VALIDATE_EMAIL_TOKEN: '/auth/email/validate',
    GOOGLE_SIGNIN: '/auth/google',
    APPLE_SIGNIN: '/auth/apple',
  },

  // User endpoints
  USERS: {
    ME: '/users/me',
    DELETE_ME: '/users/me',
    EXPORT_DATA: '/users/me/export',
    TUTORIAL_VIEWED: '/users/tutorial-viewed',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: (id: string) => `/users/${id}/profile`,
    POSTS: (id: string) => `/users/${id}/posts`,
    PUSH_TOKENS: (id: string) => `/users/${id}/push-tokens`,
    LOCATION: (id: string) => `/users/${id}/update-location`,
    SEARCH_HISTORY: (id: string) => `/users/${id}/search-history`,
    BLOCK: (id: string) => `/users/${id}/block`,
    UNBLOCK: (id: string) => `/users/${id}/unblock`,
    BLOCKED_USERS: '/users/blocks',
  },

  // Post endpoints
  POSTS: {
    BASE: '/posts',
    UPLOAD: '/posts/upload',
    BY_ID: (id: string) => `/posts/${id}`,
    LIKE: (id: string) => `/posts/${id}/like`,
    LIKES_COUNT: (id: string) => `/posts/${id}/likes/count`,
    FRESH_CONTENT: '/posts/fresh-content',
    BY_PLACE: '/posts/placeId',
    USER_HIGHLIGHTS_ACTIVE: (userId: string) =>
      `/posts/user/${userId}/highlights/active`,
    USER_HIGHLIGHTS_ALL: (userId: string) => `/posts/user/${userId}/highlights`,
  },

  // Highlight endpoints
  HIGHLIGHTS: {
    BASE: '/highlights', // POST /highlights?postId=X&userId=Y, DELETE /highlights?postId=X&userId=Y
  },

  // Favorite Places endpoints (userId from JWT token)
  FAVORITES: {
    BASE: '/favorites', // GET /favorites (get all), POST /favorites (add)
    CHECK: '/favorites/check', // GET /favorites/check?placeId=Y
    REMOVE: '/favorites', // DELETE /favorites?placeId=Y
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
    TOP_100: (type: string, userId: string) =>
      `/leaderboards/type/${type}/top100?currentUserId=${userId}`,
    BY_CLIENT: (clientId: string) => `/leaderboards/client/${clientId}`,
  },

  // Report endpoints
  REPORTS: {
    BASE: '/reports',
    BY_ID: (id: string) => `/reports/${id}`,
    BY_TYPE: (type: string) => `/reports/type/${type}`,
  },

  // Image endpoints (Cloudflare)
  IMAGES: {
    UPLOAD_POST: '/images/upload/post',
    UPLOAD_PROFILE: '/images/upload/profile',
    DELETE: (imageId: string) => `/images/${imageId}`,
  },

  // Consent endpoints
  CONSENTS: {
    ACCEPT: '/consents',
    STATUS: '/consents/status',
    WITHDRAW: '/consents/withdraw',
    VERSIONS: '/consents/versions',
  },

  // Admin endpoints
  ADMIN: {
    CONSENT_VERSIONS: '/admin/consents/versions',
    CONSENT_CURRENT_VERSIONS: '/admin/consents/current-versions',
    CONSENT_RELOAD_CACHE: '/admin/consents/reload-cache',
  },
};
