import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { primaryBgColor, primaryColor } from '@/src/app/utils/styles/colors';

interface PremiumWelcomeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PremiumWelcomeModal: React.FC<PremiumWelcomeModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
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
                  {t('subscription.welcome-title')}
                </Text>
                <Text style={styles.subtitle}>
                  {t('subscription.welcome-subtitle')}
                </Text>
              </View>

              {/* Premium Badge */}
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeTitle}>
                    {t('subscription.premium-badge')}
                  </Text>
                  <Text style={styles.badgeSubtitle}>
                    {t('subscription.welcome-badge')}
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
                  {t('subscription.welcome-message')}
                </Text>
              </View>

              {/* Close button */}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.buttonText}>
                  {t('subscription.start-enjoying')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: primaryBgColor,
    borderRadius: 24,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 380,
    borderWidth: 2,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
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
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  badge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: primaryColor,
    alignItems: 'center',
    minWidth: 220,
    shadowColor: primaryColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: primaryColor,
    letterSpacing: 1.2,
  },
  badgeSubtitle: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 2,
  },
  benefits: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
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
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: primaryColor,
  },
  messageText: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: primaryColor,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    shadowColor: primaryColor,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  buttonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PremiumWelcomeModal;
