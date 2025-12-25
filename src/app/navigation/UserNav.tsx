import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhotoResolver from '../screens/user/Post/PhotoResolver';
import Info from '../screens/user/Info/Info';
import PostSummary from '../screens/user/Post/PostSummary';
import PostDetail from '../screens/user/Post/PostDetail';
import UserDetail from '../screens/user/UserDetail';
import NotificationsList from '../screens/user/Notifications/NotificationsList';
import SelectFakeLocation from '../screens/user/SelectFakeLocation';
import Licenses from '@/src/app/screens/user/Info/Screens/LIcenses';
import AppVersion from '@/src/app/screens/user/Info/Screens/AppVersion';
import BottomTabs from '@/src/app/components/shared/BottomTabs';
import { PasswordChangeScreen } from '@/src/app/screens/user/ChangePassword';
import { AdminPanel } from '@/src/app/screens/user/AdminPanel';
import ConsentManagement from '@/src/app/screens/admin/ConsentManagement';
import { PrivacyData } from '@/src/app/screens/user/PrivacyData';
import { ReportsManagement } from '@/src/app/screens/user/ReportsManagement';
import { BlockedUsers } from '@/src/app/screens/user/BlockedUsers';
import { MyPosts } from '@/src/app/screens/user/MyPosts';
import TermsOfService from '../screens/auth/LegalDocuments/TermsOfService';
import PrivacyPolicy from '../screens/auth/LegalDocuments/PrivacyPolicy';
import CommunityGuidelines from '../screens/auth/LegalDocuments/CommunityGuidelines';
import { useNotificationsHandler } from '../components/user/NewsFeed/NotificationHandler';
import { setGlobalUnsubscribeNotifications } from '../providers/AuthProvider';
import DebugLogsScreen from '../screens/dev/DebugLogs';

const RootStack = createNativeStackNavigator();

// Deep linking configuration is handled in main navigation (index.tsx)

export function UserNav() {
  // Initialize notifications handler for authenticated users
  const { unsubscribeNotifications } = useNotificationsHandler();
  
  // Set global reference for AuthProvider to use during logout
  useEffect(() => {
    setGlobalUnsubscribeNotifications(unsubscribeNotifications);
    return () => {
      setGlobalUnsubscribeNotifications(null);
    };
  }, [unsubscribeNotifications]);

  return (
    <RootStack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{ headerShown: false }}
    >
      {/* Tabs ako hlavná časť aplikácie */}
      <RootStack.Screen name="MainTabs" component={BottomTabs} />

      {/* Extra screens mimo tabs */}
      <RootStack.Screen name="PhotoResolver" component={PhotoResolver} />
      <RootStack.Screen name="PostSummary" component={PostSummary} />
      <RootStack.Screen name="PostDetail" component={PostDetail} />
      <RootStack.Screen name="UserDetail" component={UserDetail} />
      <RootStack.Screen
        name="NotificationsList"
        component={NotificationsList}
      />
      <RootStack.Screen
        name="SelectFakeLocation"
        component={SelectFakeLocation}
      />
      <RootStack.Screen name={'Info'} component={Info} />
      <RootStack.Screen
        name="PasswordChangeScreen"
        component={PasswordChangeScreen}
      />

      <RootStack.Screen name="Licenses" component={Licenses} />
      <RootStack.Screen name="AppVersion" component={AppVersion} />
      <RootStack.Screen name="BlockedUsers" component={BlockedUsers} />
      <RootStack.Screen name="MyPosts" component={MyPosts} />

      {/* Legal Documents */}
      <RootStack.Screen name="TermsOfService" component={TermsOfService} />
      <RootStack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <RootStack.Screen name="CommunityGuidelines" component={CommunityGuidelines} />

      {/* Admin Panel for ADMIN/MODERATOR */}
      <RootStack.Screen name="AdminPanel" component={AdminPanel} />
      <RootStack.Screen name="ConsentManagement" component={ConsentManagement} />
      <RootStack.Screen name="PrivacyData" component={PrivacyData} />
      <RootStack.Screen name="ReportsManagement" component={ReportsManagement} />

      {/* Debug */}
      <RootStack.Screen name="DebugLogs" component={DebugLogsScreen} />
    </RootStack.Navigator>
  );
}
