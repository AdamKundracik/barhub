import React from 'react';
import { useUserStore } from '../utils/store/userStore';
import { UserBlocked } from '../screens/user/UserBlocked';
import { UserNav } from './UserNav';

/**
 * Wrapper that checks if user is blocked/disabled
 * Shows UserBlocked screen if user.disabled === true
 */
export const UserNavWrapper: React.FC = () => {
  const { userData } = useUserStore();

  // Check if user is disabled
  if (userData?.disabled) {
    return <UserBlocked />;
  }

  // Show normal user navigation
  return <UserNav />;
};



