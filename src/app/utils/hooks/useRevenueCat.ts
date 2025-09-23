import { useEffect, useState } from 'react';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { useUserStore } from '../store/userStore';
import { setUser } from '../services/functions';
import { User } from '@/shared';
import { auth } from '@/firebaseConfig';

const APIKeys = {
  apple: 'appl_LBCUSpmuKrFDpsDAngQHiPdmGKN',
  google: 'your_google_api_key_here',
};

export const useRevenueCat = ({
  onCustomerInfoUpdated,
}: {
  onCustomerInfoUpdated?: () => Promise<void> | void;
} = {}) => {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isReady, setIsReady] = useState(false);

  const { premium, setPremium } = useUserStore();

  useEffect(() => {
    if (!auth.currentUser) return;

    const initRevenueCat = async () => {
      try {
        const apiKey =
          Platform.OS === 'android' ? APIKeys.google : APIKeys.apple;
        Purchases.configure({ apiKey });
        await Purchases.setLogLevel(LOG_LEVEL.WARN);

        const { customerInfo } = await Purchases.logIn(auth.currentUser!.uid);
        Purchases.addCustomerInfoUpdateListener(updateCustomerInformation);

        await loadOfferings();
        await updateCustomerInformation(customerInfo);
        setIsReady(true);
      } catch (err) {
        console.error('RevenueCat init error:', err);
      }
    };

    initRevenueCat();
  }, [auth.currentUser]);

  const loadOfferings = async () => {
    const offerings = await Purchases.getOfferings();
    if (offerings.current) {
      setPackages(offerings.current.availablePackages);
    }
  };

  const updateCustomerInformation = async (customerInfo: CustomerInfo) => {
    try {
      const entitlements = customerInfo?.entitlements?.active ?? {};
      const isPremium = !!entitlements['subscription']; // názov podľa RC Dashboard

      setPremium(isPremium);
      await setUser({ premium: isPremium } as Partial<User>);

      if (onCustomerInfoUpdated) {
        await onCustomerInfoUpdated();
      }
    } catch (err) {
      console.error('updateCustomerInformation error:', err);
    }
  };

  const purchasePackage = async (pack: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      await updateCustomerInformation(customerInfo);
    } catch (e: any) {
      if (!e.userCancelled) console.error('Purchase error:', e);
    }
  };

  const restorePermissions = async () => {
    const info = await Purchases.restorePurchases();
    await updateCustomerInformation(info);
    return info;
  };

  return {
    premium,
    packages,
    isReady,
    purchasePackage,
    restorePermissions,
  };
};
