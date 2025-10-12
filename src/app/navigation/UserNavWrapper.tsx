import React, { useState } from 'react';
import { useUserStore } from '../utils/store/userStore';
import { UserBlocked } from '../screens/user/UserBlocked';
import { UserNav } from './UserNav';
import { DateOfBirthModal } from '../components/shared/Modals/DateOfBirthModal';
import { userService } from '../services/userService';
import { useCustomToast } from '../components/shared/Toaster';
import { useTranslation } from 'react-i18next';

/**
 * Wrapper that checks if user is blocked/disabled or missing date of birth
 * Shows UserBlocked screen if user.disabled === true
 * Shows DateOfBirthModal if dateOfBirth is missing (social login)
 */
export const UserNavWrapper: React.FC = () => {
  const { userData, setUserData } = useUserStore();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { t } = useTranslation();
  const [isSubmittingDate, setIsSubmittingDate] = useState(false);

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

  return (
    <>
      {/* Date of Birth Modal (Force - cannot dismiss) */}
      {needsDateOfBirth && (
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




