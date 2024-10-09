import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
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
            <FontAwesomeIcon icon={Icons.Remove} size={24} color={'white'} />
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

        <TouchableOpacity style={styles.infoLink}>
          <Text style={styles.infoText}>{t('about-app')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoLink}>
          <Text style={styles.infoText}>{t('terms-of-use')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoLink}>
          <Text style={styles.infoText}>{t('support-us')}</Text>
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
    paddingHorizontal: 10,
    paddingVertical: 32,
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
  infoLink: {
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C28',
  },
  infoText: {
    paddingVertical: 16,
    paddingLeft: 24,
    fontSize: 16,
    color: '#fff',
  },
});

export default InfoScreen;
