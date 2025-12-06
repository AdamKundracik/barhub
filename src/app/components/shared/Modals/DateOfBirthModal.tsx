import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../../utils/styles/themeColors';
import DatePicker from 'react-native-date-picker';

interface DateOfBirthModalProps {
  visible: boolean;
  onSubmit: (dateOfBirth: Date) => void;
  isLoading?: boolean;
}

export const DateOfBirthModal: React.FC<DateOfBirthModalProps> = ({
  visible,
  onSubmit,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  // Default date: 13 years ago
  const getDefaultDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 13);
    return date;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getDefaultDate());
  const [datePickerOpened, setDatePickerOpened] = useState(false);
  const [error, setError] = useState<string>('');

  const validateAge = (date: Date): boolean => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();

    // Calculate exact age
    const exactAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    return exactAge >= 13;
  };

  const handleSubmit = () => {
    if (!validateAge(selectedDate)) {
      setError(t('minimum-age-required'));
      return;
    }

    onSubmit(selectedDate);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.postBgColor }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primaryTextColor }]}>
              {t('set-date-of-birth')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondaryTextColor }]}>
              {t('date-of-birth-required-message')}
            </Text>
          </View>

          {/* Date Display */}
          <TouchableOpacity
            style={[
              styles.dateButton,
              { backgroundColor: colors.primaryBgColor, borderColor: colors.primaryColor },
            ]}
            onPress={() => setDatePickerOpened(true)}
            disabled={isLoading}
          >
            <Text style={[styles.dateText, { color: colors.primaryTextColor }]}>
              {formatDate(selectedDate)}
            </Text>
          </TouchableOpacity>

          {/* Date Picker Modal */}
          <DatePicker
            modal
            open={datePickerOpened}
            date={selectedDate}
            mode="date"
            maximumDate={new Date()}
            onConfirm={(date) => {
              setDatePickerOpened(false);
              setSelectedDate(date);
              
              // Validate age immediately after selection
              if (!validateAge(date)) {
                setError(t('minimum-age-required'));
              } else {
                setError('');
              }
            }}
            onCancel={() => {
              setDatePickerOpened(false);
            }}
          />

          {/* Error Message */}
          {error && (
            <Text style={[styles.errorText, { color: colors.warningColor }]}>
              {error}
            </Text>
          )}

          {/* Age Notice */}
          <Text style={[styles.notice, { color: colors.secondaryTextColor }]}>
            {t('minimum-age-notice')}
          </Text>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primaryColor },
              (isLoading || !!error) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading || !!error}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? t('saving') : t('permissions.continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  dateButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  notice: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  submitButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
