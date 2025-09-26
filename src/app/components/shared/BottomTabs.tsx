import React from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '@/src/app/utils/icons/icons';
import { primaryBgColor, primaryGrey } from '@/src/app/utils/styles/colors';
import { openCamera } from '@/src/app/utils/helper-functions/openCamera';
import { auth } from '@/firebaseConfig';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '@/src/app/utils/types/screen-types';
import NewsFeed from '@/src/app/screens/user/NewsFeed';
import PlaceSearch from '@/src/app/screens/user/PlaceSearch';
import LeaderboardScreen from '@/src/app/screens/user/LeaderBoard';
import Account from '@/src/app/screens/user/Account';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

function BottomTabs() {
  const { useFakeLocation } = useLocationStore();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();

  const handleOpenCamera = async () => {
    if (useFakeLocation) {
      Alert.alert('Cannot open camera with fake location');
    } else {
      await openCamera(null, auth.currentUser?.uid, navigation);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarBackground: () => (
          <BlurView intensity={80} tint="light" style={styles.blurBackground} />
        ),
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: primaryGrey,
      }}
    >
      <Tab.Screen
        name={t('explore')}
        component={NewsFeed}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={Icons.House} size={26} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name={t('search')}
        component={PlaceSearch}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={Icons.Search} size={26} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="CameraButton"
        component={View}
        options={{
          tabBarIcon: () => null,
          tabBarButton: () => (
            <TouchableOpacity
              onPress={handleOpenCamera}
              style={styles.cameraButton}
              activeOpacity={0.5}
            >
              <FontAwesomeIcon
                icon={Icons.Camera}
                size={26}
                color={primaryBgColor}
              />
            </TouchableOpacity>
          ),
        }}
        listeners={{ tabPress: e => e.preventDefault() }}
      />

      <Tab.Screen
        name={t('leaderboard.title')}
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={Icons.RankingStar} size={26} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name={t('account')}
        component={Account}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon icon={Icons.User} size={26} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default BottomTabs;

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 5,
    position: 'absolute',
    bottom: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,5,5,0.15)',
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tabBarLabel: {
    fontSize: 10, // menší text
    lineHeight: 12,
    marginTop: 2, // medzera od ikony
    textAlign: 'center',
  },
});
