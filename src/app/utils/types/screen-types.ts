import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Place } from './types';

export type UserStackList = {
  Feed: undefined;

  Account: undefined;

  PasswordChangeScreen: undefined;

  PhotoResolver: { image: string };

  Subscription: undefined;

  PlaceSearch: undefined;

  Help: undefined;

  Info: undefined;

  PostSummary: { image: string; place: Place };

  PostDetail: { postId: string };

  NotificationsList: undefined;

  SelectFakeLocation: undefined;

  Licenses: undefined;

  Leaderboard: undefined;

  TermsOfService: undefined;

  PrivacyPolicy: undefined;

  CommunityGuidelines: undefined;

  BlockedUsers: undefined;

  UserDetail: { userId: string };
};

export type FeedsScreenProps = NativeStackScreenProps<
  UserStackList,
  'Account',
  'SelectFakeLocation'
>;

export type CameraScreenProps = NativeStackScreenProps<
  UserStackList,
  'PhotoResolver',
  'PlaceSearch'
>;

export type AccountScreenProps = NativeStackScreenProps<
  UserStackList,
  'PasswordChangeScreen',
  'Help'
>;

export type SettingsScreenProps = NativeStackScreenProps<
  UserStackList,
  'Info',
  'PostSummary'
>;
