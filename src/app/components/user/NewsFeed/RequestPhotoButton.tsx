import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { commonAppStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import { iconInactiveColor, primaryColor } from '../../../utils/styles/colors';

interface RequestPhotoButtonProps {
  requestPhoto: () => void;
}

const RequestPhotoButton = ({ requestPhoto }: RequestPhotoButtonProps) => {
  const { t } = useTranslation();
  const [disabled, setDisabled] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [
        !disabled
          ? !pressed
            ? styles.button
            : styles.buttonPressed
          : styles.buttonDisabled,
      ]}
      onPress={() => {
        requestPhoto();
        setDisabled(true);
      }}
      disabled={disabled}
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
        ) : disabled ? (
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: iconInactiveColor,
            }}
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
  buttonDisabled: {
    borderRadius: 30,
    borderColor: iconInactiveColor,
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
