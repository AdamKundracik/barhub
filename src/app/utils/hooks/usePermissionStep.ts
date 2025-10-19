import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PermissionType } from './usePermissions';

export const usePermissionStep = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useTranslation();

  const showSettingsAlert = () => {
    Alert.alert(
      t('permissions.open-settings'),
      t('permissions.allow-in-settings'),
      [
        {
          text: t('permissions.settings'),
          onPress: () => Linking.openSettings(),
        },
        {
          text: t('cancel'),
          style: 'destructive',
        },
      ]
    );
  };

  const handlePermissionRequest = async (
    type: PermissionType,
    requestFn: () => Promise<boolean>
  ) => {
    try {
      const granted = await requestFn();
      if (!granted) {
        showSettingsAlert();
      }
      return granted;
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      return false;
    }
  };

  const goToNextStep = (maxSteps: number) => {
    if (currentStep < maxSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    handlePermissionRequest,
    goToNextStep,
    goToPreviousStep,
  };
};
