import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type UserStackList = {
  Feed: undefined;

  Account: undefined;

  PhotoResolver: undefined;

  Camera: { placeId: string; senderToken: string } | undefined;
};

export type FeedsScreenProps = NativeStackScreenProps<
  UserStackList,
  'Account',
  'Camera'
>;

export type CameraScreenProps = NativeStackScreenProps<
  UserStackList,
  'PhotoResolver'
>;
