import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { commonAppStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../../utils/styles/themeColors';
import { useRequestStore } from '../../../utils/store/requestStore';
import { usePlaceStore } from '../../../utils/store/placesStore';
import { Center } from '@/components/ui/center';

interface RequestPhotoButtonProps {
  requestPhoto: () => void;
}

const RequestPhotoButton = ({ requestPhoto }: RequestPhotoButtonProps) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { placeId } = usePlaceStore();
  const { addRequest, canRequest } = useRequestStore();
  const isDisabled = !canRequest(placeId ?? '');

  return (
    <Center style={{ marginVertical: 20 }}>
      <Pressable
        style={({ pressed }) => [
          !isDisabled
            ? !pressed
              ? [styles.button, { borderColor: colors.primaryColor }]
              : [
                  styles.buttonPressed,
                  {
                    backgroundColor: colors.primaryColor,
                    borderColor: colors.primaryColor,
                  },
                ]
            : [styles.buttonDisabled, { borderColor: colors.separatorColor }],
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
                { color: colors.primaryBgColor },
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
                color: colors.separatorColor,
              }}
            >
              {t('request-photo')}
            </Text>
          ) : (
            <Text
              style={[
                { color: colors.primaryColor },
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
    // borderColor is set inline to use theme colors
    borderWidth: 1,
    height: 40,
  },
  buttonDisabled: {
    // borderColor is set inline to use theme colors
    borderWidth: 1,
    height: 40,
  },
  buttonPressed: {
    borderRadius: 30,
    // backgroundColor and borderColor are set inline to use theme colors
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 36,
  },
});

export default RequestPhotoButton;
