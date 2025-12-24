import React from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { Icons } from '../../../utils/icons/icons';
import {
  primaryBgColor,
  primaryColor,
  secondaryTextColor,
} from '../../../utils/styles/colors';
import { useTranslation } from 'react-i18next';

const InfoScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with title, back icon, and info icon */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon={Icons.Remove} size={28} color={'white'} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>{t('info')}</Text>
            <Icon
              style={styles.infoIcon}
              name="information-outline"
              size={30}
              color={primaryColor}
            />
          </View>
        </View>

        <Text style={styles.description}>{t('app-info-description')}</Text>

        <View style={styles.separator} />

        <Text style={styles.sectionHeader}>{t('legal-documents')}</Text>

        <TouchableOpacity
          style={styles.infoLink}
          onPress={() => navigation.navigate('TermsOfService')}
        >
          <Text style={styles.infoText}>{t('terms-of-service')}</Text>
          <FontAwesomeIcon
            style={{ alignSelf: 'center' }}
            icon={Icons.ChevronRight}
            size={16}
            color={'white'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoLink}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={styles.infoText}>{t('privacy-policy')}</Text>
          <FontAwesomeIcon
            style={{ alignSelf: 'center' }}
            icon={Icons.ChevronRight}
            size={16}
            color={'white'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoLink}
          onPress={() => navigation.navigate('CommunityGuidelines')}
        >
          <Text style={styles.infoText}>{t('community-guidelines')}</Text>
          <FontAwesomeIcon
            style={{ alignSelf: 'center' }}
            icon={Icons.ChevronRight}
            size={16}
            color={'white'}
          />
        </TouchableOpacity>

        <View style={styles.separator} />

        <Text style={styles.sectionHeader}>{t('other')}</Text>

        <TouchableOpacity
          style={styles.infoLink}
          onPress={() => navigation.navigate('AppVersion')}
        >
          <Text style={styles.infoText}>{t('app-version')}</Text>
          <FontAwesomeIcon
            style={{ alignSelf: 'center' }}
            icon={Icons.ChevronRight}
            size={16}
            color={'white'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoLink}
          onPress={() => navigation.navigate('Licenses')}
        >
          <Text style={styles.infoText}>{t('third-party-libraries')}</Text>
          <FontAwesomeIcon
            style={{ alignSelf: 'center' }}
            icon={Icons.ChevronRight}
            size={16}
            color={'white'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoLink}
          onPress={() => navigation.navigate('DebugLogs')}
        >
          <Text style={styles.infoText}>Debug Logs</Text>
          <FontAwesomeIcon
            style={{ alignSelf: 'center' }}
            icon={Icons.ChevronRight}
            size={16}
            color={'white'}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    display: 'flex',
    flexDirection: 'row',
  },
  title: {
    fontSize: 36,
    textAlignVertical: 'center',
    fontWeight: 'bold',
    color: primaryColor,
    marginRight: 10,
  },
  infoIcon: {
    alignSelf: 'center',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: secondaryTextColor,
    marginBottom: 16,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: primaryColor,
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: primaryColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  infoLink: {
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C28',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoText: {
    paddingVertical: 16,
    fontSize: 16,
    color: '#fff',
  },
});

export default InfoScreen;
