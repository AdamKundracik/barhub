import React, { createContext, useContext, ReactNode } from 'react';
import { PurchasesPackage } from 'react-native-purchases';
import { User } from '../../../shared';
import { useUserContext } from './UserProvider';
import { useRevenueCat } from '../utils/hooks/useRevenueCat';

interface RevenueCatContextType {
  purchasePackage: (pack: PurchasesPackage) => Promise<void>;
  restorePermissions: () => Promise<any>;
  currentUser: Partial<User>;
  packages: PurchasesPackage[];
  isReady: boolean;
}

const RevenueCatContext = createContext<RevenueCatContextType | null>(null);

export const RevenueCatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { fetchUserData } = useUserContext();

  const revenueCatHook = useRevenueCat(async (user: Partial<User>) => {
    // Callback when user subscription status changes
    await fetchUserData?.();
  });

  if (!revenueCatHook.isReady) {
    return <>{children}</>;
  }

  return (
    <RevenueCatContext.Provider value={revenueCatHook}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCatProvider = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error(
      'useRevenueCatProvider must be used within a RevenueCatProvider'
    );
  }
  return context;
};
