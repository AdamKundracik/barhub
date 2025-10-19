import React, { useEffect } from 'react';
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
import { primaryBgColor, separatorColor } from '@/src/app/utils/styles/colors';
import { openCamera } from '@/src/app/utils/helper-functions/openCamera';
import { auth } from '@/firebaseConfig';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '@/src/app/utils/types/screen-types';
import NewsFeed from '@/src/app/screens/user/NewsFeed';
import PlaceSearch from '@/src/app/screens/user/PlaceSearch';
import LeaderboardScreen from '@/src/app/screens/user/LeaderBoard';
import { Account } from '@/src/app/screens/user/Account';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { usePostsStore } from '@/src/app/utils/store/postStore';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { useNewsFeedData } from '@/src/app/utils/hooks/NewsFeed/usePostData';
import { useUserRole } from '@/src/app/hooks/useUserRole';
import { TutorialWizard } from './TutorialWizard';
import { useTutorial } from '@/src/app/utils/hooks/useTutorial';
import { useNavigationStore } from '@/src/app/utils/store/navigationStore';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  const { useFakeLocation } = useLocationStore();
  const { scrollOnTop } = usePostsStore();
  const { userData } = useUserStore();
  const { refetch } = useNewsFeedData();
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const { hasAdminAccess } = useUserRole();
  const { showTutorial, markTutorialAsViewed, skipTutorial } = useTutorial();
  const { setPreviousPage } = useNavigationStore();

  // console.log('[BottomTabs] showTutorial:', showTutorial);

  // Track navigation state changes to store previous page
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e) => {
      const state = e.data.state;
      if (state && state.routes && state.routes.length > 0) {
        const currentRoute = state.routes[state.index];
        if (currentRoute && currentRoute.name) {
          setPreviousPage(currentRoute.name);
        }
      }
    });

    return unsubscribe;
  }, [navigation, setPreviousPage]);

  const handleOpenCamera = async () => {
    // 1️⃣ Block if using fake location
    if (useFakeLocation) {
      Alert.alert(t('camera.fakeLocationBlocked'));
      return;
    }

    // 2️⃣ Check last uploaded post (5 min cooldown) - only for regular users
    if (!hasAdminAccess) {
      const lastDate = userData?.lastUploadedPostAt
        ? new Date(userData.lastUploadedPostAt)
        : null;
      if (lastDate) {
        const now = Date.now();
        const diffMs = now - lastDate.getTime();
        const fiveMinutes = 5 * 60 * 1000;

        if (diffMs < fiveMinutes) {
          const waitMs = fiveMinutes - diffMs;
          const formatWait = (ms: number) => {
            const totalSeconds = Math.ceil(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          };
          Alert.alert(
            t('camera.waitBeforeNextUpload', { time: formatWait(waitMs) })
          );
          return;
        }
      }
    }

    // 3️⃣ Open camera
    await openCamera(null, auth.currentUser?.uid, navigation);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarBackground: () => (
            <BlurView
              intensity={80}
              tint="dark"
              style={styles.blurBackground}
            />
          ),
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: { paddingVertical: 0 },
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: separatorColor,
        }}
      >
        <Tab.Screen
          name="Feed"
          component={NewsFeed}
          options={{
            tabBarLabel: t('explore'),
            tabBarIcon: ({ color }) => (
              <FontAwesomeIcon icon={Icons.House} size={26} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: async () => {
              const state = navigation.getState();
              const focused = state.routes[state.index].name;

              if (focused === 'Feed') {
                scrollOnTop();
                await refetch();
              }
            },
          })}
        />

        <Tab.Screen
          name="PlaceSearch"
          component={PlaceSearch}
          options={{
            tabBarLabel: t('search'),
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
          name="LeaderboardScreen"
          component={LeaderboardScreen}
          options={{
            tabBarLabel: t('leaderboard.title'),
            tabBarIcon: ({ color }) => (
              <FontAwesomeIcon
                icon={Icons.RankingStar}
                size={26}
                color={color}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Account"
          component={Account}
          options={{
            tabBarLabel: t('account'),
            tabBarIcon: ({ color }) => (
              <FontAwesomeIcon icon={Icons.User} size={26} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      <TutorialWizard
        visible={showTutorial}
        onComplete={markTutorialAsViewed}
        onSkip={skipTutorial}
      />
    </>
  );
};

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
    fontSize: 10,
    lineHeight: 12,
    marginTop: 2,
    textAlign: 'center',
  },
});
