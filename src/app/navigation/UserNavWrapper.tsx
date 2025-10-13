import React, { useState } from 'react';
import { useUserStore } from '../utils/store/userStore';
import { UserBlocked } from '../screens/user/UserBlocked';
import { UserNav } from './UserNav';
import { DateOfBirthModal } from '../components/shared/Modals/DateOfBirthModal';
import { OutdatedConsentsModal } from '../components/shared/Modals/OutdatedConsentsModal';
import { userService } from '../services/userService';
import { consentService } from '../services/consentService';
import { useCustomToast } from '../components/shared/Toaster';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../providers/AuthProvider';

/**
 * Wrapper that checks if user is blocked/disabled, missing date of birth, or outdated consents
 * Shows UserBlocked screen if user.disabled === true
 * Shows DateOfBirthModal if dateOfBirth is missing (social login)
 * Shows OutdatedConsentsModal if consents are outdated
 */
export const UserNavWrapper: React.FC = () => {
  const { userData, setUserData } = useUserStore();
  const { pendingConsents, setPendingConsents, logout } = useAuth();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { t } = useTranslation();
  const [isSubmittingDate, setIsSubmittingDate] = useState(false);
  const [isAcceptingConsents, setIsAcceptingConsents] = useState(false);

  // Check if user is disabled
  if (userData?.disabled) {
    return <UserBlocked />;
  }

  // Check if dateOfBirth is missing (for social login users)
  const needsDateOfBirth = userData && !userData.dateOfBirth;

  const handleDateOfBirthSubmit = async (dateOfBirth: Date) => {
    if (!userData?.id) return;

    setIsSubmittingDate(true);
    try {
      // Update user with date of birth
      const updatedUser = await userService.updateUser(userData.id.toString(), {
        dateOfBirth: dateOfBirth.toISOString(),
      });

      // Update local store
      setUserData(updatedUser);

      showSuccessToast(
        t('date-of-birth-updated'),
        t('date-of-birth-updated-message')
      );
    } catch (error: any) {
      console.error('Error updating date of birth:', error);
      showErrorToast(
        t('error'),
        error?.message || t('failed-to-update-date-of-birth')
      );
    } finally {
      setIsSubmittingDate(false);
    }
  };

  const handleAcceptConsents = async () => {
    if (!pendingConsents || pendingConsents.length === 0 || !userData?.id)
      return;

    setIsAcceptingConsents(true);
    try {
      // Extract consent types
      const consentTypes = pendingConsents.map(c => c.consentType);

      // Accept consents on backend
      const result = await consentService.acceptConsents(
        userData.id.toString(),
        consentTypes
      );

      if (result.success) {
        // Clear pending consents
        setPendingConsents(null);

        showSuccessToast(
          t('consents-accepted'),
          t('consents-accepted-message')
        );
      } else {
        throw new Error(result.message || 'Failed to accept consents');
      }
    } catch (error: any) {
      console.error('Error accepting consents:', error);
      showErrorToast(
        t('error'),
        error?.message || t('failed-to-accept-consents')
      );
    } finally {
      setIsAcceptingConsents(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setPendingConsents(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      {/* Outdated Consents Modal (Force - cannot dismiss) */}
      {pendingConsents && pendingConsents.length > 0 && (
        <OutdatedConsentsModal
          visible={true}
          outdatedConsents={pendingConsents}
          onAccept={handleAcceptConsents}
          onLogout={handleLogout}
          isLoading={isAcceptingConsents}
        />
      )}

      {/* Date of Birth Modal (Force - cannot dismiss) */}
      {!pendingConsents && needsDateOfBirth && (
        <DateOfBirthModal
          visible={needsDateOfBirth}
          onSubmit={handleDateOfBirthSubmit}
          isLoading={isSubmittingDate}
        />
      )}

      {/* Show normal user navigation */}
      <UserNav />
    </>
  );
};
