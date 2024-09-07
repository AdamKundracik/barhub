import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { commonAppStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import { primaryBgColor, primaryColor } from '../../../utils/styles/colors';

interface RequestPhotoButtonProps {
  requestPhoto: () => void;
}

const RequestPhotoButton = ({ requestPhoto }: RequestPhotoButtonProps) => {
  const { t } = useTranslation();

  return (
    <Pressable
      style={({ pressed }) => [!pressed ? styles.button : styles.buttonPressed]}
      onPress={requestPhoto}
    >
      {({ pressed }) =>
        pressed ? (
          <Text
            style={[
              commonAppStyles.textSecondary,
              { fontSize: 16, fontWeight: 'bold' },
            ]}
          >
            {t('request-photo')}
          </Text>
        ) : (
          <Text
            style={[
              commonAppStyles.textPrimary,
              { fontSize: 16, fontWeight: 'bold' },
            ]}
          >
            {t('request-photo')}
          </Text>
        )
      }
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 30,
    borderColor: primaryColor,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 36,
  },
  buttonPressed: {
    borderRadius: 30,
    backgroundColor: primaryColor,
    borderColor: primaryColor,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 36,
  },
});

export default RequestPhotoButton;
