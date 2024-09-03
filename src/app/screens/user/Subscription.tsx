import RevenueCatUI from 'react-native-purchases-ui';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { reload } from 'firebase/auth';
import { auth } from '../../../../firebaseConfig';

export const Subscription = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  return (
    <RevenueCatUI.Paywall
      options={{ displayCloseButton: true }}
      onDismiss={() => navigation.navigate('Account')}
      onPurchaseCompleted={async () => {
        navigation.navigate('Account');
        await reload(auth.currentUser!);
      }}
    ></RevenueCatUI.Paywall>
  );
};

export default Subscription;
