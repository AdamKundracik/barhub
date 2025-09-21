import {
  Alert,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { ReactNode, useState } from 'react';
import {
  iconInactiveColor,
  primaryBgColor,
  primaryColor,
  primaryGrey,
} from '../../../utils/styles/colors';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { TabsTypes } from '../../../utils/types/types';
import {
  NavigationProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { openCamera } from '../../../utils/helper-functions/openCamera';
import { auth } from '../../../../../firebaseConfig';
import RollupMenu from '../RollupMenu';
import FilterSlider from '../NewsFeed/Filters/FilterSlider';
import { useNotifications } from '../../../utils/store/notificationsStore';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { useTranslation } from 'react-i18next';

type LayoutProps = {
  children: ReactNode | ReactNode[];
  pageTitle: string;
  showBottomTabs?: boolean;
};

export const Layout = ({ children, showBottomTabs = true }: LayoutProps) => {
  const { userData } = useUserStore();
  const { useFakeLocation } = useLocationStore();

  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const route = useRoute();
  const { data } = useNotifications();
  const { t } = useTranslation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [filtersOpened, setFiltersOpened] = useState(false);

  async function handleOpenCamera() {
    if (useFakeLocation) {
      Alert.alert(t('camera-cannot-open-fake-location'));
    } else {
      await openCamera(null, auth.currentUser?.uid, navigation);
    }
  }

  const handleTabPress = (tab: TabsTypes) => {
    if (route.name === tab) {
      navigation.navigate('Feed');
      return null;
    } else {
      switch (tab) {
        case TabsTypes.account:
          setMenuOpen(true);
          break;
        case TabsTypes.placeSearch:
          navigation.navigate('PlaceSearch');
          break;
        default:
          navigation.navigate('Feed');
      }
      return tab;
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 5,
          }}
        >
          <View>
            <Svg width="91" height="28" viewBox="0 0 91 28" fill="none">
              <Path
                d="M16.944 21.968V23H0V21.968H2.328V6.224H8.856C9.992 6.224 10.968 6.36 11.784 6.632C12.616 6.904 13.232 7.272 13.632 7.736C14.4 8.6 14.784 9.576 14.784 10.664C14.784 11.976 14.368 12.952 13.536 13.592C13.232 13.816 13.024 13.96 12.912 14.024C12.8 14.072 12.6 14.16 12.312 14.288C13.352 14.512 14.176 14.984 14.784 15.704C15.408 16.408 15.72 17.288 15.72 18.344C15.72 19.928 15.096 21.136 13.848 21.968H16.944ZM5.16 20.384H9.6C10.64 20.384 11.432 20.224 11.976 19.904C12.536 19.568 12.816 18.944 12.816 18.032C12.816 16.544 11.624 15.8 9.24 15.8H5.16V20.384ZM5.16 13.184H8.76C10.808 13.184 11.832 12.488 11.832 11.096C11.832 10.296 11.584 9.72 11.088 9.368C10.592 9.016 9.824 8.84 8.784 8.84H5.16V13.184ZM37.0813 21.968V23H31.7293L30.0493 19.184H21.6493L19.9693 23H14.6173V21.968H17.4013L24.3373 6.224H27.3613L34.2973 21.968H37.0813ZM28.8973 16.568L25.8493 9.656L22.8013 16.568H28.8973ZM52.8298 21.968V23H47.6458L43.6378 17.36H39.9178V23H34.7578V21.968H37.0858V6.224H43.3258C45.8858 6.224 47.7178 6.656 48.8218 7.52C49.9258 8.384 50.4778 9.768 50.4778 11.672C50.4778 14.44 49.2698 16.184 46.8538 16.904L50.5018 21.968H52.8298ZM43.4458 14.792C45.0458 14.792 46.1338 14.544 46.7098 14.048C47.2858 13.552 47.5738 12.76 47.5738 11.672C47.5738 10.568 47.2778 9.816 46.6858 9.416C46.0938 9 45.0378 8.792 43.5178 8.792H39.9178V14.792H43.4458Z"
                fill="white"
              />
              <Path
                d="M63.0968 22.398V23H60.0868V18.996H55.2288V23H53.5768V13.214H55.2288V17.456H60.0868V13.214H61.7388V22.398H63.0968ZM53.5768 22.398H52.2188V23H53.5768V22.398ZM73.8536 22.398V23H63.1016V22.398H65.9996C64.8889 21.6233 64.3336 20.396 64.3336 18.716V13.214H65.9856V18.646C65.9856 19.542 66.2096 20.2513 66.6576 20.774C67.1056 21.2967 67.7122 21.558 68.4776 21.558C69.2429 21.558 69.8496 21.2967 70.2976 20.774C70.7456 20.2513 70.9696 19.542 70.9696 18.646V13.214H72.6216V18.716C72.6216 20.4053 72.0616 21.6327 70.9416 22.398H73.8536ZM83.7317 22.398V23H73.8477V22.398H75.2057V13.214H79.0137C79.6763 13.214 80.2457 13.2933 80.7217 13.452C81.207 13.6107 81.5663 13.8253 81.7997 14.096C82.2477 14.6 82.4717 15.1693 82.4717 15.804C82.4717 16.5693 82.229 17.1387 81.7437 17.512C81.5663 17.6427 81.445 17.7267 81.3797 17.764C81.3143 17.792 81.1977 17.8433 81.0297 17.918C81.6363 18.0487 82.117 18.324 82.4717 18.744C82.8357 19.1547 83.0177 19.668 83.0177 20.284C83.0177 21.208 82.6537 21.9127 81.9257 22.398H83.7317ZM76.8577 21.474H79.4477C80.0543 21.474 80.5163 21.3807 80.8337 21.194C81.1603 20.998 81.3237 20.634 81.3237 20.102C81.3237 19.234 80.6283 18.8 79.2377 18.8H76.8577V21.474ZM76.8577 17.274H78.9577C80.1523 17.274 80.7497 16.868 80.7497 16.056C80.7497 15.5893 80.605 15.2533 80.3157 15.048C80.0263 14.8427 79.5783 14.74 78.9717 14.74H76.8577V17.274Z"
                fill="#10D9B9"
              />
            </Svg>
          </View>
          <View style={{ gap: 20, display: 'flex', flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('NotificationsList')}
            >
              <FontAwesomeIcon
                icon={Icons.Bell}
                color={iconInactiveColor}
                size={22}
              />
              {data?.hasNewNotifications == true && (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    backgroundColor: primaryColor,
                    width: 10,
                    height: 10,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                ></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFiltersOpened(true)}>
              <FontAwesomeIcon
                icon={Icons.Sliders}
                color={iconInactiveColor}
                size={22}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Subscription')}
            >
              <FontAwesomeIcon icon={Icons.Coins} color={'#FBBC05'} size={22} />
            </TouchableOpacity>
          </View>
        </View>
      </>

      <View style={styles.mainContent}>{children}</View>

      {showBottomTabs && (
        <View style={styles.bottomTab}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={async () => handleOpenCamera()}
          >
            <FontAwesomeIcon
              icon={Icons.Camera}
              size={24}
              color={
                route.name === TabsTypes.camera ? 'white' : iconInactiveColor
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileIconWrapper}
            onPress={() => {
              handleTabPress(TabsTypes.account);
            }}
          >
            {userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL ?? '' }}
                style={styles.profileIcon}
              />
            ) : (
              <Svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                <Path
                  d="M25.0003 6.28979e-05C11.1864 6.28979e-05 0 11.2423 0 25.1251C0 28.7049 0.749508 32.1595 2.18752 35.4251C2.37551 35.9281 3.00053 36.1171 3.43754 35.9281C3.93803 35.7392 4.12604 35.111 3.93803 34.6719C2.62452 31.6563 1.93851 28.5157 1.93851 25.1859C1.93851 12.3734 12.3149 2.0093 25 2.0093C37.6883 2.0093 48.0615 12.3118 48.0615 25.125C48.0615 28.4545 47.373 31.5953 46.062 34.6109C45.874 35.1139 46.062 35.6782 46.5625 35.8672C46.687 35.931 46.8115 35.931 46.9385 35.931C47.3144 35.931 47.627 35.7421 47.8125 35.3666C49.2505 32.1597 50 28.7054 50 25.125C50 11.2422 38.8142 6.28979e-05 25.0003 6.28979e-05Z"
                  fill={
                    route.name === TabsTypes.account
                      ? 'white'
                      : iconInactiveColor
                  }
                />
                <Path
                  d="M5.11153 39.7802C4.9194 40.1574 4.98427 40.5958 5.23879 40.8455C10.1595 46.6765 17.3133 50 24.9789 50C32.6444 50 39.7983 46.6768 44.6544 40.9734C44.6544 40.9734 44.6544 40.9098 44.7193 40.9098C44.7842 40.8461 44.7842 40.7849 44.8465 40.7849C44.8465 40.7212 44.9114 40.66 44.9114 40.66C45.0387 40.4102 45.0387 40.0967 44.8465 39.8444C41.7175 34.2658 36.3499 30.4405 30.1542 28.9979C33.5404 27.1808 35.7762 23.669 35.7762 19.6579C35.7762 13.7657 30.9203 9 24.9166 9C18.913 9 14.0571 13.7657 14.0571 19.6579C14.0571 23.6692 16.3578 27.181 19.679 28.9979C13.6729 30.3766 8.24355 34.2017 5.11153 39.7802ZM16.1007 19.5937C16.1007 14.7668 20.0608 10.8805 24.9787 10.8805C29.8967 10.8805 33.8567 14.767 33.8567 19.5937C33.8567 24.3593 29.8967 28.3068 24.9787 28.3068C20.0608 28.3068 16.1007 24.4203 16.1007 19.5937ZM24.9787 30.2515C32.3249 30.2515 39.0322 34.0768 42.7379 40.1577C38.2663 45.1731 31.8132 48.1191 24.9787 48.1191C18.2062 48.1191 11.8182 45.2342 7.21956 40.1577C10.9899 34.0132 17.6971 30.2515 24.9787 30.2515Z"
                  fill={
                    route.name === TabsTypes.account
                      ? 'white'
                      : iconInactiveColor
                  }
                />
              </Svg>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => {
              handleTabPress(TabsTypes.placeSearch);
            }}
          >
            <FontAwesomeIcon
              icon={Icons.Search}
              size={24}
              color={
                route.name === TabsTypes.placeSearch
                  ? 'white'
                  : iconInactiveColor
              }
            />
          </TouchableOpacity>
        </View>
      )}
      {menuOpen && <RollupMenu setVisible={setMenuOpen} visible={menuOpen} />}
      <FilterSlider
        opened={filtersOpened}
        onClose={() => setFiltersOpened(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  mainContent: {
    flex: 1,
    // paddingHorizontal: 10,
    paddingVertical: 10,
  },
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
