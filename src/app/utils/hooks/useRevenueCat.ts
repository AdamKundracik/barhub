import { useEffect, useState } from 'react';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { useUserStore } from '../store/userStore';
import { useAuth } from '../../providers/AuthProvider';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { useTranslation } from 'react-i18next';

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
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { t } = useTranslation();

  const { isPremium } = useUserStore();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const initRevenueCat = async () => {
      try {
        const apiKey =
          Platform.OS === 'android' ? APIKeys.google : APIKeys.apple;
        Purchases.configure({ apiKey });
        await Purchases.setLogLevel(LOG_LEVEL.WARN);

        const { customerInfo } = await Purchases.logIn(user.id.toString());
        Purchases.addCustomerInfoUpdateListener(updateCustomerInformation);

        await loadOfferings();
        await updateCustomerInformation(customerInfo);
        setIsReady(true);
      } catch (err) {
        console.error('RevenueCat init error:', err);
      }
    };

    initRevenueCat();
  }, [user?.id]);

  const loadOfferings = async () => {
    const offerings = await Purchases.getOfferings();
    if (offerings.current) {
      setPackages(offerings.current.availablePackages);
    }
  };

  const updateCustomerInformation = async (customerInfo: CustomerInfo) => {
    try {
      const entitlements = customerInfo?.entitlements?.active ?? {};
      const isPremiumInRC = !!entitlements['subscription']; // názov podľa RC Dashboard

      // console.log('[RevenueCat] Customer info updated - Premium in RC:', isPremiumInRC);
      // console.log('[RevenueCat] Premium status is managed by backend webhook - not updating locally');

      // DO NOT update premium locally - it's managed by backend via webhook
      // Backend will receive webhook from RevenueCat and update DB
      // Frontend will get updated premium status via auto-refresh (every 30s)

      // Trigger callback to refresh user data from backend
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
      showSuccessToast(t('purchase-success'), t('enjoy-benefits-message'));
    } catch (e: any) {
      if (!e.userCancelled) console.error('Purchase error:', e);
      showErrorToast(t('something-went-wrong'));
    }
  };

  const restorePermissions = async () => {
    const info = await Purchases.restorePurchases();
    await updateCustomerInformation(info);
    return info;
  };

  return {
    premium: isPremium(),
    packages,
    isReady,
    purchasePackage,
    restorePermissions,
  };
};
