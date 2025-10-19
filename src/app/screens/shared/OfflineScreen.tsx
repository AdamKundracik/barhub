import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTranslation } from 'react-i18next';
import { useNetwork } from '../../providers/NetworkProvider';
import { primaryBgColor } from '../../utils/styles/colors';
import { Icons } from '../../utils/icons/icons';

export const OfflineScreen: React.FC = () => {
  const { t } = useTranslation();
  const { networkType } = useNetwork();

  const handleRetry = () => {
    // The NetworkProvider will automatically detect when connection is restored
    // This button is mainly for user feedback
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <FontAwesomeIcon 
          icon={Icons.Wifi} 
          size={80} 
          color="#6B7280" 
          style={styles.icon}
        />
        
        <Text style={styles.title}>
          {t('no_internet_title', 'No Internet Connection')}
        </Text>
        
        <Text style={styles.description}>
          {t('no_internet_description', 'Please check your connection and try again. Barhub requires an internet connection to work properly.')}
        </Text>
        
        <Text style={styles.networkInfo}>
          {t('network_type', 'Network type')}: {networkType}
        </Text>

        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <FontAwesomeIcon 
            icon={Icons.Rotate} 
            size={16} 
            color="#FFFFFF" 
            style={styles.buttonIcon}
          />
          <Text style={styles.retryButtonText}>
            {t('retry', 'Retry')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryBgColor,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  networkInfo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
