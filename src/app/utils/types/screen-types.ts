import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Place, PlacePrediction } from './types';

export type UserStackList = {
  Feed: { selectedPlace: PlacePrediction } | undefined;

  Account: undefined;

  PhotoResolver: { image: string };

  Camera: { placeId: string; senderToken: string } | undefined;

  Subscription: undefined;

  PlaceSearch: undefined;
};

export type FeedsScreenProps = NativeStackScreenProps<
  UserStackList,
  'Account',
  'Camera'
>;

export type CameraScreenProps = NativeStackScreenProps<
  UserStackList,
  'PhotoResolver',
  'PlaceSearch'
>;
