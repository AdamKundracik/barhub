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
import { primaryColor, secondaryTextColor } from '../../../utils/styles/colors';
import { useThemeColors } from '../../../utils/styles/themeColors';
import { useTranslation } from 'react-i18next';

const InfoScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const colors = useThemeColors();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.primaryBgColor }]}
    >
      <View style={styles.container}>
        {/* Header with title, back icon, and info icon */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesomeIcon
              icon={Icons.Remove}
              size={28}
              color={colors.primaryTextColor}
            />
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
          style={[
            styles.infoLink,
            { borderBottomColor: colors.separatorColor },
          ]}
          onPress={() => navigation.navigate('TermsOfService')}
        >
          <Text style={[styles.infoText, { color: colors.primaryTextColor }]}>
            {t('terms-of-service')}
          </Text>
          <FontAwesomeIcon
            style={{ alignSelf: 'center' }}
            icon={Icons.ChevronRight}
            size={16}
            color={colors.primaryTextColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.infoLink,
            { borderBottomColor: colors.separatorColor },
          ]}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={[styles.infoText, { color: colors.primaryTextColor }]}>
            {t('privacy-policy')}
          </Text>
          <FontAwesomeIcon
            style={{ alignSelf: 'center' }}
            icon={Icons.ChevronRight}
            size={16}
            color={colors.primaryTextColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.infoLink,
            { borderBottomColor: colors.separatorColor },
          ]}
          onPress={() => navigation.navigate('CommunityGuidelines')}
        >
          <Text style={[styles.infoText, { color: colors.primaryTextColor }]}>
            {t('community-guidelines')}
          </Text>
          <FontAwesomeIcon
            style={{ alignSelf: 'center' }}
            icon={Icons.ChevronRight}
            size={16}
            color={colors.primaryTextColor}
          />
        </TouchableOpacity>

        <View style={styles.separator} />

        <Text style={styles.sectionHeader}>{t('other')}</Text>

        <TouchableOpacity
          style={[
            styles.infoLink,
            { borderBottomColor: colors.separatorColor },
          ]}
          onPress={() => navigation.navigate('Licenses')}
        >
          <Text style={[styles.infoText, { color: colors.primaryTextColor }]}>
            {t('third-party-libraries')}
          </Text>
          <FontAwesomeIcon
            style={{ alignSelf: 'center' }}
            icon={Icons.ChevronRight}
            size={16}
            color={colors.primaryTextColor}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor is set inline to use theme colors
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
    // borderBottomColor is set inline to use theme colors
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoText: {
    paddingVertical: 16,
    fontSize: 16,
    // color is set inline to use theme colors
  },
});

export default InfoScreen;
