import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { primaryColor } from '@/src/app/utils/styles/colors';

interface ThankYouScreenProps {
  onClose?: () => void;
}

export const ThankYouScreen: React.FC<ThankYouScreenProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('subscription.thank-you-title')}
            </Text>
            <Text style={styles.subtitle}>
              {t('subscription.thank-you-subtitle')}
            </Text>
          </View>

          {/* Premium Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeTitle}>
                {t('subscription.premium-badge')}
              </Text>
              <Text style={styles.badgeSubtitle}>
                {t('subscription.yearly-subscription')}
              </Text>
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.benefits}>
            <Text style={styles.benefitsTitle}>
              {t('subscription.premium-benefits')}
            </Text>

                   <View style={styles.benefitsList}>
                     <View style={styles.benefitItem}>
                       <Text style={styles.benefitIcon}>🚫</Text>
                       <Text style={styles.benefitText}>
                         {t('subscription.no-ads')}
                       </Text>
                     </View>

                     <View style={styles.benefitItem}>
                       <Text style={styles.benefitIcon}>🔓</Text>
                       <Text style={styles.benefitText}>
                         {t('subscription.access-all-benefits')}
                       </Text>
                     </View>

                     <View style={styles.benefitItem}>
                       <Text style={styles.benefitIcon}>✈️</Text>
                       <Text style={styles.benefitText}>
                         {t('subscription.travel-mode')}
                       </Text>
                     </View>

                     <View style={styles.benefitItem}>
                       <Text style={styles.benefitIcon}>📊</Text>
                       <Text style={styles.benefitText}>
                         {t('subscription.leaderboards')}
                       </Text>
                     </View>

                     <View style={styles.benefitItem}>
                       <Text style={styles.benefitIcon}>⭐</Text>
                       <Text style={styles.benefitText}>
                         {t('subscription.more-highlights')}
                       </Text>
                     </View>
                   </View>
          </View>

          {/* Thank you message */}
          <View style={styles.thankYouMessage}>
            <Text style={styles.messageText}>
              {t('subscription.thank-you-message')}
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.buttonText}>{t('subscription.close')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  badge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 36,
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    minWidth: 240,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  badgeSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  benefits: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 14,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  benefitIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
  },
  thankYouMessage: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 32,
  },
  messageText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: primaryColor,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ThankYouScreen;
