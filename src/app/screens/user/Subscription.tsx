import React from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { ThankYouScreen } from '@/src/app/components/subscription/ThankYouScreen';
import { PremiumHelpers } from '@/src/app/config/premiumConfig';

// Import original subscription components (commented out for now)
// import RevenueCatUI from 'react-native-purchases-ui';
// import { useUserData } from '@/src/app/utils/hooks/useUserData';
// import { useRevenueCat } from '@/src/app/utils/hooks/useRevenueCat';
// import { PremiumWelcomeModal } from '@/src/app/components/subscription/PremiumWelcomeModal';
// import { useState } from 'react';

export const Subscription = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  // If premium features are disabled, always show thank you screen
  if (!PremiumHelpers.shouldShowSubscriptionUI()) {
    return (
      <ThankYouScreen 
        onClose={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Feed');
          }
        }} 
      />
    );
  }

  // TODO: When premium is re-enabled, uncomment and restore original subscription logic
  /*
  const { refetch } = useUserData();
  const { currentSubscriptionType, currentOffering, offerings } = useRevenueCat();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // If user has yearly premium subscription, show thank you screen
  if (currentSubscriptionType === 'barhub_premium_1y') {
    return (
      <ThankYouScreen 
        onClose={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Feed');
          }
        }} 
      />
    );
  }

  // Original subscription logic would go here...
  return (
    <>
      <RevenueCatUI.Paywall
        options={{
          displayCloseButton: true,
          offering: selectedOffering,
        }}
        onDismiss={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Feed');
          }
        }}
        onPurchaseCompleted={async () => {
          if (refetch) refetch();
          navigation.navigate('Feed');
          setTimeout(() => {
            setShowWelcomeModal(true);
          }, 500);
        }}
      />
      <PremiumWelcomeModal
        visible={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </>
  );
  */

  // Fallback to thank you screen
  return (
    <ThankYouScreen 
      onClose={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Feed');
        }
      }} 
    />
  );
};

export default Subscription;
