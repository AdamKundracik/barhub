import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../providers/AuthProvider';
import {
  primaryBgColor,
  primaryColor,
  warningColor,
  separatorColor,
} from '../../utils/styles/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenLayout } from '../../components/shared/Layouts/ScreenLayout';

export const UserBlocked: React.FC = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#EF4444', '#DC2626', '#B91C1C']}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesomeIcon icon={Icons.Lock} size={64} color="#FFF" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('userBlocked.title')}</Text>

          {/* Message */}
          <Text style={styles.message}>{t('userBlocked.message')}</Text>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <FontAwesomeIcon
              icon={Icons.Info}
              size={20}
              color={primaryColor}
            />
            <Text style={styles.infoText}>{t('userBlocked.info')}</Text>
          </View>

          {/* Contact Support */}
          <Text style={styles.contactText}>{t('userBlocked.contact')}</Text>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <FontAwesomeIcon
              icon={Icons.LogOut}
              size={20}
              color={warningColor}
            />
            <Text style={styles.logoutButtonText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryBgColor,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: warningColor,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 217, 185, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 217, 185, 0.2)',
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: primaryColor,
    lineHeight: 20,
  },
  contactText: {
    fontSize: 16,
    color: separatorColor,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(254, 120, 120, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(254, 120, 120, 0.2)',
    width: '100%',
    marginTop: 16,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: warningColor,
  },
});

