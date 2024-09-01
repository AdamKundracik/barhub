import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { commonAppStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';

interface RequestPhotoButtonProps {
  requestPhoto: () => void;
}

const RequestPhotoButton = ({ requestPhoto }: RequestPhotoButtonProps) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={{
        borderRadius: 10,
        backgroundColor: '#d8d8d8',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
      }}
      onPress={requestPhoto}
    >
      <Text
        style={[
          commonAppStyles.textSecondary,
          { fontSize: 22, fontWeight: 'bold' },
        ]}
      >
        {t('request-photo')}
      </Text>
    </TouchableOpacity>
  );
};

export default RequestPhotoButton;
