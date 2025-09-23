import { useEffect, useState } from 'react';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { setUser } from '../services/functions';
import { User } from '@/shared';

const APIKeys = {
  apple: 'appl_LBCUSpmuKrFDpsDAngQHiPdmGKN',
  google: 'your_google_api_key_here',
};

export const useRevenueCat = () => {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isReady, setIsReady] = useState(false);

  const { premium, setPremium, setUserData } = useUserStore();

  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        const apiKey =
          Platform.OS === 'android' ? APIKeys.google : APIKeys.apple;

        Purchases.configure({ apiKey });
        await Purchases.setLogLevel(LOG_LEVEL.WARN);

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
    try {
      const entitlements = customerInfo?.entitlements?.active ?? {};
      const isPremium = !!entitlements['subscription']; // správny názov entitlementu

      // uloženie do userStore
      setPremium(isPremium);

      // sync s backendom
      await setUser({ premium: isPremium } as Partial<User>);
    } catch (error) {
      console.error('Error updating customer information:', error);
    }
  };

  const purchasePackage = async (pack: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);

      // hneď po nákupe aktualizuj premium stav
      await updateCustomerInformation(customerInfo);
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase error:', e);
      }
    }
  };

  const restorePermissions = async () => {
    try {
      const customer = await Purchases.restorePurchases();
      await updateCustomerInformation(customer); // aby sa rovno syncol store
      return customer;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  };

  return {
    premium,
    packages,
    isReady,
    purchasePackage,
    restorePermissions,
  };
};
