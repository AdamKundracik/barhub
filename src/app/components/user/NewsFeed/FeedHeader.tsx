import React from 'react';
import { Text, View } from 'react-native';
import { PlacePrediction } from '../../../utils/types/types';
import ActionsRow from '../ActionsRow';
import PlaceFilterChip from './PlaceFilterChip';
import Svg, { Path } from 'react-native-svg';

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
