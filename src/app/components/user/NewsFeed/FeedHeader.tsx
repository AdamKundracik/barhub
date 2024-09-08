import React from 'react';
import { View } from 'react-native';
import { PlacePrediction } from '../../../utils/types/types';
import PlaceFilterChip from './PlaceFilterChip';

interface HeaderProps {
  place: PlacePrediction | null;
  setPlace: (place: PlacePrediction | null) => void;
}

const FeedHeader: React.FC<HeaderProps> = ({ place, setPlace }) => (
  <>
    {place && (
      <View style={{ alignSelf: 'flex-start', marginBottom: 5 }}>
        <PlaceFilterChip
          setPlace={setPlace}
          place={place.structuredFormat?.mainText.text}
        />
      </View>
    )}
  </>
);

export default FeedHeader;
