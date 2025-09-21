import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from '@/components/ui/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const useCustomToast = () => {
  const toast = useToast();

  const showSuccessToast = (title: string, description?: string) => {
    toast.show({
      placement: 'top',
      duration: 3000,
      render: ({ id }) => (
        <Toast
          nativeID={`toast-${id}`}
          action="success"
          variant="outline"
          style={[styles.successContainer, { width: SCREEN_WIDTH - 20 }]} // 20px padding from edges
        >
          <ToastTitle style={styles.successTitle}>{title}</ToastTitle>
          {description && (
            <ToastDescription style={styles.successDescription}>
              {description}
            </ToastDescription>
          )}
        </Toast>
      ),
    });
  };

  const showErrorToast = (title: string, description?: string) => {
    toast.show({
      placement: 'top',
      duration: 3000,
      render: ({ id }) => (
        <Toast
          nativeID={`toast-${id}`}
          action="error"
          variant="outline"
          style={[styles.errorContainer, { width: SCREEN_WIDTH - 20 }]} // full width minus padding
        >
          <ToastTitle style={styles.errorTitle}>{title}</ToastTitle>
          {description && (
            <ToastDescription style={styles.errorDescription}>
              {description}
            </ToastDescription>
          )}
        </Toast>
      ),
    });
  };

  return { showSuccessToast, showErrorToast };
};

const styles = StyleSheet.create({
  successContainer: {
    backgroundColor: 'rgba(20,27,34,0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    alignSelf: 'center', // center horizontally
  },
  successTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  successDescription: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 18,
  },
  errorContainer: {
    backgroundColor: '#1F1F1F',
    borderColor: '#FF4D4F',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    alignSelf: 'center', // center horizontally
  },
  errorTitle: {
    color: '#FF4D4F',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  errorDescription: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 18,
  },
});
