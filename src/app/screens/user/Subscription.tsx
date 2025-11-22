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
  const { currentSubscriptionType, currentOffering, offerings } =
    useRevenueCat();
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

  // Get the appropriate offering based on subscription type
  const getOffering = () => {
    console.log('offerings', offerings);
    console.log('currentOffering', currentOffering);

    // Use the currentOffering from the hook (which is already mapped correctly)
    if (currentOffering) {
      return currentOffering;
    }

    // Fallback logic if currentOffering is not available
    if (currentSubscriptionType === 'barhub_premium_1m') {
      return offerings.all['month-premium'];
    }

    // Default offering for users with no subscription or other subscription types
    return offerings?.current || offerings?.all?.default;
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
        onDismiss={() => {
          // Try to go back, but if it fails, navigate to Feed
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            console.log('Cannot go back, navigating to Feed');
            navigation.navigate('Feed');
          }
        }}
        onPurchaseCompleted={async () => {
          if (refetch) refetch();
          
          // Navigate to Feed screen instead of using goBack
          navigation.navigate('Feed');
          
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
