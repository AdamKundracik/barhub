import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PermissionType } from './usePermissions';

export const usePermissionStep = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useTranslation();

  const handlePermissionRequest = async (
    type: PermissionType,
    requestFn: () => Promise<boolean>
  ) => {
    try {
      const granted = await requestFn();
      // Respect user's decision - don't redirect to Settings or ask to reconsider
      // per Apple guidelines 5.1.1
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
