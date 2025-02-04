import { createContext, useContext, useEffect, useState } from 'react';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { User } from '../../../shared';
import { setUser } from '../utils/services/functions';
import { useUserContext } from './UserProvider';

const APIKeys = {
  apple: 'appl_LBCUSpmuKrFDpsDAngQHiPdmGKN',
  google: 'your_google_api_key_here',
};

interface RevenueCatProps {
  purchasePackage?: (pack: PurchasesPackage) => Promise<void>;
  restorePermissions?: () => Promise<CustomerInfo>;
  currentUser: Partial<User>;
  packages: PurchasesPackage[];
}

export interface UserState {
  premiun: boolean;
}

export const RevenueCatProvider = ({ children }: any) => {
  const [currentUser, setCurrentUser] = useState<Partial<User>>({
    premium: false,
  });
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isReady, setIsReady] = useState(false);
  const { fetchUserData } = useUserContext();

  useEffect(() => {
    const init = async () => {
      try {
        if (Platform.OS === 'android') {
          Purchases.configure({ apiKey: APIKeys.google });
        } else {
          Purchases.configure({ apiKey: APIKeys.apple });
        }
        setIsReady(true);
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        Purchases.addCustomerInfoUpdateListener(updateCustomerInformation);
        await loadOfferings();
      } catch (error) {
        console.error('Error during initialization: ', error);
      }
    };
    init();
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
      console.error('Error loading offerings: ', error);
    }
  };

  const updateCustomerInformation = async (customerInfo: CustomerInfo) => {
    const newUser: Partial<User> = { premium: false };

    if (customerInfo?.entitlements.active['subscription'] !== undefined) {
      newUser.premium = true;
    }

    setCurrentUser(newUser);
    await setUser(newUser);
    await fetchUserData;
  };

  const purchasePackage = async (pack: PurchasesPackage) => {
    try {
      await Purchases.purchasePackage(pack);
    } catch (e: any) {
      if (!e.userCancelled) {
        alert(e);
      }
    }
  };

  const restorePermissions = async () => {
    const customer = await Purchases.restorePurchases();
    return customer;
  };

  const value = {
    restorePermissions,
    currentUser,
    packages,
    purchasePackage,
  };

  if (!isReady) return <></>;

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};

const RevenueCatContext = createContext<RevenueCatProps | null>(null);

export const useRevenueCat = () => {
  return useContext(RevenueCatContext) as RevenueCatProps;
};
