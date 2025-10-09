import React, { createContext, ReactNode, useContext } from 'react';
import { PurchasesPackage } from 'react-native-purchases';
import { User } from '@/shared';
import { useUserData } from '@/src/app/hooks/useUserQuery';
import { useRevenueCat } from '@/src/app/utils/hooks/useRevenueCat';

interface RevenueCatContextType {
  purchasePackage: (pack: PurchasesPackage) => Promise<void>;
  restorePermissions: () => Promise<any>;
  packages: PurchasesPackage[];
  isReady: boolean;
  premium: boolean;
  currentUser: Partial<User>;
}

const RevenueCatContext = createContext<RevenueCatContextType | null>(null);

export const RevenueCatProvider = ({ children }: { children: ReactNode }) => {
  const {
    userData: currentUser,
    refetch: refetchUserData,
    isPremium,
  } = useUserData();

  // Pass refetch function to RevenueCat hook for manual refresh after purchase
  const revenueCatHook = useRevenueCat({
    onCustomerInfoUpdated: async () => {
      // console.log('[RevenueCatProvider] Refreshing user data from backend after purchase...');
      await refetchUserData();
    },
  });

  return (
    <RevenueCatContext.Provider
      value={{
        ...revenueCatHook,
        premium: isPremium, // Use premium from DB, not from RevenueCat SDK
        currentUser: currentUser ?? {},
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCatProvider = () => {
  const ctx = useContext(RevenueCatContext);
  if (!ctx)
    throw new Error(
      'useRevenueCatProvider must be used inside RevenueCatProvider'
    );
  return ctx;
};
