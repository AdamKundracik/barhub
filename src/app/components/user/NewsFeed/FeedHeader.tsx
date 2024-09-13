import React from 'react';
import { View } from 'react-native';
import { PlacePrediction } from '../../../utils/types/types';
import PlaceFilterChip from './PlaceFilterChip';

interface HeaderProps {
  placeName: string | null;
  setPlaceId: (placeId: string | null) => void;
  setPlaceName: (placeName: string | null) => void;
}

const FeedHeader: React.FC<HeaderProps> = ({
  placeName,
  setPlaceName,
  setPlaceId,
}) => (
  <>
    {placeName && (
      <View style={{ alignSelf: 'flex-start', marginBottom: 5 }}>
        <PlaceFilterChip
          setPlaceName={setPlaceName}
          setPlaceId={setPlaceId}
          place={placeName}
        />
      </View>
    )}
  </>
);

export default FeedHeader;
