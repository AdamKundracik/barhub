import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { ReactNode, useState } from 'react';
import {
  iconInactiveColor,
  primaryBgColor,
  primaryColor,
  primaryGrey,
} from '../../../utils/styles/colors';
import Svg, { Path } from 'react-native-svg';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import RollupMenu from '@/src/app/components/shared/Modals/RollupMenu';
import FilterSlider from '../../user/NewsFeed/Filters/FilterSlider';
import { useNotificationsHandler } from '@/src/app/components/user/NewsFeed/NotificationHandler';
import BottomTabs from '@/src/app/components/shared/BottomTabs';
import { useNotificationsStore } from '@/src/app/utils/store/notificationsStore';

type LayoutProps = {
  children: ReactNode | ReactNode[];
  pageTitle: string;
  showBottomTabs?: boolean;
  showTopBar?: boolean;
};

export const Layout = ({
  children,
  showBottomTabs = true,
  showTopBar = true,
}: LayoutProps) => {
  useNotificationsHandler();

  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { data } = useNotificationsStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [filtersOpened, setFiltersOpened] = useState(false);

  const handleToggleMenu = () => setMenuOpen(prev => !prev);
  const handleCloseMenu = () => setMenuOpen(false);

  return (
    <SafeAreaView style={styles.wrapper}>
      {showTopBar && (
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 5,
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
      )}
      <View style={{ flex: 1 }}>{children}</View>

      {showBottomTabs && <BottomTabs onToggleMenu={handleToggleMenu} />}

      {menuOpen && (
        <RollupMenu visible={menuOpen} setVisible={handleCloseMenu} />
      )}

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
