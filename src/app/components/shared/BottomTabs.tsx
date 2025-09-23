import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import {
  NavigationProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { TabsTypes } from '@/src/app/utils/types/types';
import { UserStackList } from '@/src/app/utils/types/screen-types';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { auth } from '@/firebaseConfig';
import { openCamera } from '@/src/app/utils/helper-functions/openCamera';
import { Icons } from '@/src/app/utils/icons/icons';
import {
  iconInactiveColor,
  primaryBgColor,
} from '@/src/app/utils/styles/colors';

type BottomTabsProps = {
  onToggleMenu: () => void;
};

const BottomTabs = ({ onToggleMenu }: BottomTabsProps) => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const route = useRoute();
  const { userData } = useUserStore();
  const { useFakeLocation } = useLocationStore();

  const handleTabPress = (tab: TabsTypes) => {
    if (route.name === tab) {
      navigation.navigate('Feed');
    } else {
      switch (tab) {
        case TabsTypes.account:
          onToggleMenu();
          break;
        case TabsTypes.placeSearch:
          navigation.navigate('PlaceSearch');
          break;
        default:
          navigation.navigate('Feed');
      }
    }
  };

  const handleOpenCamera = async () => {
    if (useFakeLocation) {
      Alert.alert('Cannot open camera with fake location');
    } else {
      await openCamera(null, auth.currentUser?.uid, navigation);
    }
  };

  return (
    <>
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabButton} onPress={handleOpenCamera}>
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
          onPress={() => handleTabPress(TabsTypes.account)}
        >
          {userData?.photoURL ? (
            <Image
              source={{ uri: userData.photoURL ?? '' }}
              style={styles.profileIcon}
              priority={'high'}
            />
          ) : (
            <Svg width="50" height="50" viewBox="0 0 50 50" fill="none">
              <Path
                d="M25.0003 0C11.1864 0 0 11.2423 0 25.125C0 28.7049 0.7495 32.1595 2.18752 35.425C2.37551 35.9281 3.00053 36.1171 3.43754 35.9281C3.93803 35.7392 4.12604 35.111 3.93803 34.6719C2.62452 31.6563 1.93851 28.5157 1.93851 25.1859C1.93851 12.3734 12.3149 2.0093 25 2.0093C37.6883 2.0093 48.0615 12.3118 48.0615 25.125C48.0615 28.4545 47.373 31.5953 46.062 34.6109C45.874 35.1139 46.062 35.6782 46.5625 35.8672C46.687 35.931 46.8115 35.931 46.9385 35.931C47.3144 35.931 47.627 35.7421 47.8125 35.3666C49.2505 32.1597 50 28.7054 50 25.125C50 11.2422 38.8142 0 25.0003 0Z"
                fill={
                  route.name === TabsTypes.account ? 'white' : iconInactiveColor
                }
              />
            </Svg>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => handleTabPress(TabsTypes.placeSearch)}
        >
          <FontAwesomeIcon
            icon={Icons.Search}
            size={24}
            color={
              route.name === TabsTypes.placeSearch ? 'white' : iconInactiveColor
            }
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
    borderColor: 'grey',
    borderWidth: 2,
  },
});

export default BottomTabs;
