// Deep linking configuration for React Navigation

// Common prefixes for all linking configurations
const LINK_PREFIXES = ['https://barhubapp.com', 'https://www.barhubapp.com'];

// Helper function for token parsing/stringify
const createTokenConfig = () => ({
  parse: {
    token: (token: string) => token,
  },
  stringify: {
    token: (token: string) => token,
  },
});

// Helper function for ID-based routes (postId, userId)
const createIdConfig = (paramName: string) => ({
  parse: {
    [paramName]: (id: string) => id,
  },
});

// Deep linking configuration for NotVerified navigator
export const notVerifiedLinking = {
  prefixes: LINK_PREFIXES,
  config: {
    screens: {
      EmailNotVerified: 'email-not-verified',
      VerifyEmail: {
        path: 'verify-email/:token',
        ...createTokenConfig(),
      },
      ResetPassword: {
        path: 'reset-password/:token',
        ...createTokenConfig(),
      },
    },
  },
};

// Deep linking configuration for Auth navigator
export const authLinking = {
  prefixes: LINK_PREFIXES,
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: {
        path: 'reset-password/:token',
        ...createTokenConfig(),
      },
      VerifyEmail: {
        path: 'verify-email/:token',
        ...createTokenConfig(),
      },
      PostDetail: {
        path: 'post/:postId',
        ...createIdConfig('postId'),
      },
      UserDetail: {
        path: 'user/:userId',
        ...createIdConfig('userId'),
      },
    },
  },
};

// Deep linking configuration for main app
export const mainLinking = {
  prefixes: LINK_PREFIXES,
  config: {
    screens: {
      MainTabs: {
        path: '',
        screens: {
          Feed: 'feed',
          PlaceSearch: 'search',
          Profile: 'profile',
        },
      },
      PostDetail: {
        path: 'post/:postId',
        ...createIdConfig('postId'),
      },
      UserDetail: {
        path: 'user/:userId',
        ...createIdConfig('userId'),
      },
      VerifyEmail: {
        path: 'verify-email/:token',
        parse: {
          token: (token: string) => token,
        },
      },
      ResetPassword: {
        path: 'reset-password/:token',
        parse: {
          token: (token: string) => token,
        },
      },
      PhotoResolver: 'photo-resolver',
      PostSummary: 'post-summary',
      NotificationsList: 'notifications',
      Info: 'info',
      AdminPanel: 'admin',
    },
  },
};
