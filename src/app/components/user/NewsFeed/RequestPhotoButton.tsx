import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { commonAppStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import { iconInactiveColor, primaryColor } from '../../../utils/styles/colors';
import { useRequestStore } from '../../../utils/store/requestStore';
import { usePlaceStore } from '../../../utils/store/placesStore';

interface RequestPhotoButtonProps {
  requestPhoto: () => void;
}

const RequestPhotoButton = ({ requestPhoto }: RequestPhotoButtonProps) => {
  const { t } = useTranslation();
  const { placeId } = usePlaceStore();
  const { addRequest, canRequest } = useRequestStore();
  const isDisabled = !canRequest(placeId ?? '');

  return (
    <Pressable
      style={({ pressed }) => [
        !isDisabled
          ? !pressed
            ? styles.button
            : styles.buttonPressed
          : styles.buttonDisabled,
      ]}
      onPress={() => {
        requestPhoto();
        addRequest(placeId ?? '');
      }}
      disabled={isDisabled}
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
        ) : isDisabled ? (
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
