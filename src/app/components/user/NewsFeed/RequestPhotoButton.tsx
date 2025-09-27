import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { commonAppStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import { primaryColor, separatorColor } from '../../../utils/styles/colors';
import { useRequestStore } from '../../../utils/store/requestStore';
import { usePlaceStore } from '../../../utils/store/placesStore';
import { Center } from '@/components/ui/center';

interface RequestPhotoButtonProps {
  requestPhoto: () => void;
}

const RequestPhotoButton = ({ requestPhoto }: RequestPhotoButtonProps) => {
  const { t } = useTranslation();
  const { placeId } = usePlaceStore();
  const { addRequest, canRequest } = useRequestStore();
  const isDisabled = !canRequest(placeId ?? '');

  return (
    <Center style={{ marginVertical: 20 }}>
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
                color: separatorColor,
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
    </Center>
  );
};

const styles = StyleSheet.create({
  button: {
    borderColor: primaryColor,
    borderWidth: 1,
    height: 40,
  },
  buttonDisabled: {
    borderColor: separatorColor,
    borderWidth: 1,
    height: 40,
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
