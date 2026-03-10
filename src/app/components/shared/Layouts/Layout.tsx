import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { ReactNode } from 'react';
import {
  primaryBgColor,
  primaryColor,
  primaryGrey,
} from '../../../utils/styles/colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { useNotificationsStore } from '@/src/app/utils/store/notificationsStore';
import { useModalsStore } from '@/src/app/utils/store/modalsStore';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { useTranslation } from 'react-i18next';

type LayoutProps = {
  children: ReactNode | ReactNode[];
  pageTitle: string;
  showBottomTabs?: boolean;
  showTopBar?: boolean;
};

export const Layout = ({ children, showTopBar = true }: LayoutProps) => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { data } = useNotificationsStore();
  const { toggleFilter, openTravelMode } = useModalsStore();
  const { useFakeLocation } = useLocationStore();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.wrapper}>
      {showTopBar && (
        <View style={styles.topBar}>
          {/* Logo */}
          <Image
            source={require('../../../../../assets/inline-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Travel Mode - stred */}
          {useFakeLocation && (
            <View style={styles.travelModeContainer}>
              <TouchableOpacity
                onPress={openTravelMode}
                activeOpacity={0.7}
                style={styles.travelModeButton}
                hitSlop={{ top: 5, bottom: 5, left: 10, right: 10 }}
              >
                <FontAwesomeIcon
                  icon={Icons.Plane}
                  size={20}
                  color={primaryColor}
                />
                <Text style={styles.travelModeText}>{t('active')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pravé ikony */}
          <View style={styles.rightIcons}>
            <TouchableOpacity
              onPress={() => navigation.navigate('NotificationsList')}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <FontAwesomeIcon icon={Icons.Bell} color="white" size={22} />
              {data?.hasNewNotifications && (
                <View style={styles.notificationDot} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleFilter}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <FontAwesomeIcon icon={Icons.Sliders} color="white" size={22} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  logo: {
    width: 100,
    height: 28,
  },

  travelModeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  travelModeButton: {
    alignItems: 'center',
  },
  travelModeText: {
    color: primaryColor,
    fontSize: 9,
    fontWeight: '600',
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 20,
  },
  notificationDot: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: primaryColor,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    flex: 1,
  },
  // Zachované pre prípad použitia inde
  bottomTab: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: primaryBgColor,
    paddingVertical: 10,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconWrapper: {
    backgroundColor: primaryBgColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 28,
    borderColor: primaryGrey,
    borderWidth: 2,
  },
  profileIconInactive: {
    width: 50,
    height: 50,
    borderRadius: 28,
    borderColor: primaryGrey,
    borderWidth: 2,
    opacity: 0.3,
  },
});

export default Layout;
