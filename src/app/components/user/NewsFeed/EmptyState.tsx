import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { commonAppStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  requestPhoto: () => void;
}

export const EmptyState = (props: EmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        flex: 1,
        alignSelf: 'center',
        justifyContent: 'center',
        width: 300,
      }}
    >
      <Text style={[commonAppStyles.textPrimary, { fontSize: 22 }]}>
        {t('photos-info')}
      </Text>
      <TouchableOpacity
        onPress={props.requestPhoto}
        style={{
          borderRadius: 10,
          backgroundColor: '#d8d8d8',
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 10,
          marginBottom: 15,
        }}
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
      <Text style={{ color: '#a6a6a6' }}>{t('request-photo-info')}</Text>
    </View>
  );
};

export default EmptyState;
