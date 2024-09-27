import RevenueCatUI from 'react-native-purchases-ui';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserContext } from '../../providers/UserProvider';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';

export const Subscription = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { fetchUserData } = useUserContext();

  return (
    <RevenueCatUI.Paywall
      options={{ displayCloseButton: true }}
      onDismiss={navigation.goBack}
      onPurchaseCompleted={async () => {
        if (fetchUserData) fetchUserData();
        navigation.goBack();
      }}
    ></RevenueCatUI.Paywall>
  );
};

const styles = StyleSheet.create({
  closeButton: {},
});

export default Subscription;
