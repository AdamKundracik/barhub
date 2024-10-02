import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type UserStackList = {
  Feed: undefined;

  Account: undefined;

  PasswordChangeScreen: undefined;

  PhotoResolver: { image: string };

  Subscription: undefined;

  PlaceSearch: undefined;

  Help: undefined;

  Info: undefined;
};

export type FeedsScreenProps = NativeStackScreenProps<UserStackList, 'Account'>;

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

export type SettingsScreenProps = NativeStackScreenProps<UserStackList, 'Info'>;
