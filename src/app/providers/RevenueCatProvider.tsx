import React, { createContext, ReactNode, useContext } from 'react';
import { PurchasesPackage } from 'react-native-purchases';
import { User } from '../../../shared';
import { useRevenueCat } from '../utils/hooks/useRevenueCat';
import { useUserData } from '@/src/app/utils/hooks/useUserData';

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
  const { refetch } = useUserData();

  const revenueCatHook = useRevenueCat(async (user: Partial<User>) => {
    // Callback when user subscription status changes
    await refetch?.();
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
