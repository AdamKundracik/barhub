import { useCallback, useEffect, useState } from 'react';
import { userSelectors, useUserStore } from '../store/userStore';
import { useCustomToast } from '../../components/shared/Toaster';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../providers/AuthProvider';
import { userService } from '../../services/userService';

export const useTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { t } = useTranslation();
  const user = useUserStore(userSelectors.userData);
  const tutorialViewed = useUserStore(userSelectors.tutorialViewed);
  const updateUserData = useUserStore(state => state.updateUserData);
  const { pendingConsents } = useAuth();

  // Check if tutorial should be shown
  useEffect(() => {

    if (user) {
      // Tutorial should be shown only when:
      // 1. User has not viewed tutorial yet
      // 2. User has date of birth set
      // 3. User has no pending consents (all consents are accepted)
      
      const hasDateOfBirth = !!user.dateOfBirth;
      const hasNoPendingConsents = !pendingConsents || pendingConsents.length === 0;
      const shouldShow = !user.tutorialViewed && hasDateOfBirth && hasNoPendingConsents;
      
      
      setShowTutorial(shouldShow);
    } else {
      setShowTutorial(false);
    }
  }, [user, tutorialViewed, pendingConsents]);

  const markTutorialAsViewed = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Call backend endpoint to mark tutorial as viewed
      await userService.markTutorialAsViewed();

      // Update local store
      updateUserData({
        tutorialViewed: true,
      });

      // Hide tutorial
      setShowTutorial(false);

      showSuccessToast(t('tutorial.completed'), t('tutorial.welcomeMessage'));
    } catch (error: any) {
      console.error('Failed to mark tutorial as viewed:', error);
      showErrorToast(t('error'), t('tutorial.saveProgressError'));
    } finally {
      setLoading(false);
    }
  }, [user, showSuccessToast, showErrorToast, t, updateUserData]);

  const skipTutorial = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Call backend endpoint to mark tutorial as viewed
      await userService.markTutorialAsViewed();

      // Update local store
      updateUserData({
        tutorialViewed: true,
      });

      // Hide tutorial
      setShowTutorial(false);
    } catch (error: any) {
      console.error('Failed to skip tutorial:', error);
      showErrorToast(t('error'), t('tutorial.skipError'));
    } finally {
      setLoading(false);
    }
  }, [user, showErrorToast, t, updateUserData]);

  const showTutorialAgain = useCallback(() => {
    setShowTutorial(true);
  }, []);

  return {
    showTutorial,
    tutorialViewed,
    loading,
    markTutorialAsViewed,
    skipTutorial,
    showTutorialAgain,
  };
};
