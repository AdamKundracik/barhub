import RevenueCatUI from 'react-native-purchases-ui';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserData } from '@/src/app/utils/hooks/useUserData';
import { useRevenueCat } from '@/src/app/utils/hooks/useRevenueCat';
import { ThankYouScreen } from '@/src/app/components/subscription/ThankYouScreen';
import { PremiumWelcomeModal } from '@/src/app/components/subscription/PremiumWelcomeModal';
import { useState } from 'react';

export const Subscription = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { refetch } = useUserData();
  const { currentSubscriptionType, offerings } = useRevenueCat();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // If user has yearly premium subscription, show thank you screen
  if (currentSubscriptionType === 'barhub_premium_1y') {
    return (
      <ThankYouScreen 
        onClose={() => navigation.goBack()}
      />
    );
  }

  // Get the appropriate offering based on subscription type
  const getOffering = () => {
    if (
      currentSubscriptionType === 'barhub_premium_1m' &&
      offerings?.month_premium
    ) {
      return offerings.month_premium;
    }
    // Default offering for users with no subscription or other subscription types
    return offerings?.default || offerings?.current;
  };

  const selectedOffering = getOffering();

  // Log the subscription type for debugging
  console.log('Current subscription type:', currentSubscriptionType);
  console.log('Selected offering:', selectedOffering?.identifier);

  return (
    <>
      <RevenueCatUI.Paywall
        options={{
          displayCloseButton: true,
          offering: selectedOffering,
          // The paywall content is determined by the offering configuration in RevenueCat dashboard
          // Different offerings can have different paywall templates configured
        }}
        onDismiss={navigation.goBack}
        onPurchaseCompleted={async () => {
          if (refetch) refetch();
          // Navigate back to feed first
          navigation.goBack();
          // Show welcome modal after navigation
          setTimeout(() => {
            setShowWelcomeModal(true);
          }, 500); // Small delay to ensure navigation is complete
        }}
      />
      
      {/* Premium Welcome Modal */}
      <PremiumWelcomeModal
        visible={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </>
  );
};

export default Subscription;
