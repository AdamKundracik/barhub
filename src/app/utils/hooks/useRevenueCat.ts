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

// Helper function to determine subscription type from product identifier
const getSubscriptionTypeFromProductId = (productId: string): string => {
  const lowerProductId = productId.toLowerCase();
  
  if (lowerProductId.includes('barhub_premium_1y') || lowerProductId.includes('yearly') || lowerProductId.includes('annual')) {
    return 'barhub_premium_1y';
  } else if (lowerProductId.includes('barhub_premium_1m') || lowerProductId.includes('monthly')) {
    return 'barhub_premium_1m';
  } else if (lowerProductId.includes('subscription') || lowerProductId.includes('premium')) {
    return 'subscription';
  } else {
    // Fallback to product identifier if no specific pattern matches
    return productId;
  }
};

// Helper function to get the appropriate offering based on subscription type
const getOfferingForSubscriptionType = (offerings: any, subscriptionType: string | null): any => {
  if (!offerings || !subscriptionType) {
    return offerings?.current || null;
  }

  // Map subscription types to specific offerings
  if (subscriptionType === 'barhub_premium_1m' || subscriptionType.includes('monthly')) {
    return offerings.all?.['month-premium'] || offerings.current;
  } else if (subscriptionType === 'barhub_premium_1y' || subscriptionType.includes('yearly') || subscriptionType.includes('annual')) {
    return offerings.all?.['year-premium'] || offerings.current;
  } else {
    return offerings.current;
  }
};

export const useRevenueCat = ({
  onCustomerInfoUpdated,
}: {
  onCustomerInfoUpdated?: () => Promise<void> | void;
} = {}) => {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [currentSubscriptionType, setCurrentSubscriptionType] = useState<
    string | null
  >(null);
  const [currentProductIdentifier, setCurrentProductIdentifier] = useState<
    string | null
  >(null);
  const [offerings, setOfferings] = useState<any>(null);
  const [currentOffering, setCurrentOffering] = useState<any>(null);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { t } = useTranslation();

  const { isPremium } = useUserStore();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Defer RevenueCat initialization to avoid blocking app startup
    const deferredInit = setTimeout(() => {
      initRevenueCat();
    }, 3000); // Wait 3 seconds after app initialization

    return () => {
      clearTimeout(deferredInit);
    };
  }, [user?.id]);

  const initRevenueCat = async () => {
    try {
      const apiKey =
        Platform.OS === 'android' ? APIKeys.google : APIKeys.apple;
      Purchases.configure({ apiKey });
      await Purchases.setLogLevel(LOG_LEVEL.WARN);

      const { customerInfo } = await Purchases.logIn(user?.id?.toString() || '');
      Purchases.addCustomerInfoUpdateListener(updateCustomerInformation);

      await loadOfferings();
      await updateCustomerInformation(customerInfo);
      setIsReady(true);
    } catch (err) {
      console.error('RevenueCat init error:', err);
    }
  };

  // Update offering when subscription type changes
  useEffect(() => {
    if (offerings && currentSubscriptionType) {
      const appropriateOffering = getOfferingForSubscriptionType(offerings, currentSubscriptionType);
      if (appropriateOffering) {
        setCurrentOffering(appropriateOffering);
        setPackages(appropriateOffering.availablePackages);
        console.log('useEffect: Updated offering to:', appropriateOffering.identifier);
      }
    }
  }, [currentSubscriptionType, offerings]);

  const loadOfferings = async () => {
    const offeringsData = await Purchases.getOfferings();
    setOfferings(offeringsData);
    
    console.log('Available offerings:', Object.keys(offeringsData.all || {}));
    
    // Set appropriate offering based on current subscription type
    const appropriateOffering = getOfferingForSubscriptionType(offeringsData, currentSubscriptionType);
    if (appropriateOffering) {
      setCurrentOffering(appropriateOffering);
      setPackages(appropriateOffering.availablePackages);
      console.log('Offering set to:', appropriateOffering.identifier);
    } else if (offeringsData.current) {
      // Fallback to default offering
      setCurrentOffering(offeringsData.current);
      setPackages(offeringsData.current.availablePackages);
      console.log('Fallback offering set to:', offeringsData.current.identifier);
    }
  };

  const updateCustomerInformation = async (customerInfo: CustomerInfo) => {
    try {
      if (!customerInfo) {
        console.warn('CustomerInfo is null or undefined');
        setCurrentSubscriptionType(null);
        setCurrentProductIdentifier(null);
        return;
      }

      const entitlements = customerInfo?.entitlements?.active ?? {};
      const isPremiumInRC = !!entitlements['subscription']; // názov podľa RC Dashboard

      // Get current subscription type and product identifier from active entitlements
      // This safely accesses customerInfo?.entitlements?.active['subscription'].productIdentifier
      const activeEntitlements = Object.keys(entitlements);
      let subscriptionType: string | null = null;

      if (activeEntitlements.length > 0) {
        console.log('Active entitlements:', activeEntitlements);
        
        // Safely access subscription product identifier
        const subscriptionEntitlement = entitlements['subscription'];
        if (subscriptionEntitlement) {
          console.log('Current subscription product:', subscriptionEntitlement.productIdentifier);
          
          // Get the product identifier to determine subscription type
          const productId = subscriptionEntitlement.productIdentifier;
          if (productId) {
            subscriptionType = getSubscriptionTypeFromProductId(productId);
            setCurrentProductIdentifier(productId);
          } else {
            console.warn('Product identifier is null or undefined');
            setCurrentProductIdentifier(null);
          }
        } else {
          console.log('No active subscription entitlement found');
          setCurrentProductIdentifier(null);
        }
      } else {
        console.log('No active entitlements found');
        setCurrentProductIdentifier(null);
      }

      setCurrentSubscriptionType(subscriptionType);

      // Update current offering based on subscription type
      if (offerings) {
        const appropriateOffering = getOfferingForSubscriptionType(offerings, subscriptionType);
        if (appropriateOffering) {
          setCurrentOffering(appropriateOffering);
          setPackages(appropriateOffering.availablePackages);
          console.log('Updated offering to:', appropriateOffering.identifier);
        }
      }

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
      // Set subscription type and product identifier to null on error to avoid stale state
      setCurrentSubscriptionType(null);
      setCurrentProductIdentifier(null);
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

  // Function to manually switch to a specific offering
  const switchToOffering = (offeringIdentifier: string) => {
    if (!offerings?.all?.[offeringIdentifier]) {
      console.warn(`Offering '${offeringIdentifier}' not found`);
      return;
    }

    const newOffering = offerings.all[offeringIdentifier];
    setCurrentOffering(newOffering);
    setPackages(newOffering.availablePackages);
    console.log('Switched to offering:', newOffering.identifier);
  };

  return {
    premium: isPremium(),
    packages,
    isReady,
    purchasePackage,
    restorePermissions,
    switchToOffering,
    currentSubscriptionType,
    currentProductIdentifier,
    currentOffering,
    offerings,
  };
};
