import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  iconInactiveColor,
  primaryColor,
  secondaryTextColor,
} from '../../../utils/styles/colors';
import RequestPhotoButton from './RequestPhotoButton';

interface EmptyStateProps {
  requestPhoto: () => void;
}

const EmptyState = (props: EmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.infoText}>{t('photos-info')}</Text>
        <RequestPhotoButton requestPhoto={props.requestPhoto} />
        <Text style={styles.infoText2}>{t('request-photo-info')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    width: 300,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: primaryColor,
    borderRadius: 20,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 16,
    color: secondaryTextColor,
    marginBottom: 16, // Adjust as needed
  },
  infoText2: {
    textAlign: 'center',
    fontSize: 16,
    color: iconInactiveColor,
    marginBottom: 16, // Adjust as needed
  },
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
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: primaryColor,
  },
});

export default EmptyState;
