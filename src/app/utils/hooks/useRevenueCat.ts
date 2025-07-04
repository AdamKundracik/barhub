import { useState, useEffect } from 'react';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { User } from '../../../../shared';
import { setUser } from '../services/functions';

const APIKeys = {
  apple: 'appl_LBCUSpmuKrFDpsDAngQHiPdmGKN',
  google: 'your_google_api_key_here',
};

export const useRevenueCat = (onUserUpdate?: (user: Partial<User>) => void) => {
  const [currentUser, setCurrentUser] = useState<Partial<User>>({
    premium: false,
  });
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        const apiKey =
          Platform.OS === 'android' ? APIKeys.google : APIKeys.apple;
        Purchases.configure({ apiKey });

        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        Purchases.addCustomerInfoUpdateListener(updateCustomerInformation);
        await loadOfferings();

        setIsReady(true);
      } catch (error) {
        console.error('Error during RevenueCat initialization:', error);
      }
    };

    initRevenueCat();
  }, []);

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setPackages(offerings.current.availablePackages);
      } else {
        console.warn('No current offerings found.');
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
    }
  };

  const updateCustomerInformation = async (customerInfo: CustomerInfo) => {
    const newUser: Partial<User> = { premium: false };

    if (customerInfo?.entitlements.active['subscription'] !== undefined) {
      newUser.premium = true;
    }

    setCurrentUser(newUser);
    await setUser(newUser);
    onUserUpdate?.(newUser);
  };

  const purchasePackage = async (pack: PurchasesPackage) => {
    try {
      await Purchases.purchasePackage(pack);
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase error:', e);
        // Handle error appropriately
      }
    }
  };

  const restorePermissions = async () => {
    try {
      const customer = await Purchases.restorePurchases();
      return customer;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  };

  return {
    currentUser,
    packages,
    isReady,
    purchasePackage,
    restorePermissions,
  };
};
