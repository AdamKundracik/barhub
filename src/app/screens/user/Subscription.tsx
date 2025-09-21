import RevenueCatUI from 'react-native-purchases-ui';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserData } from '@/src/app/utils/hooks/useUserData';

export const Subscription = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { refetch } = useUserData();

  return (
    <RevenueCatUI.Paywall
      options={{ displayCloseButton: true }}
      onDismiss={navigation.goBack}
      onPurchaseCompleted={async () => {
        if (refetch) refetch();
        navigation.goBack();
      }}
    ></RevenueCatUI.Paywall>
  );
};

export default Subscription;
