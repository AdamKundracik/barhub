import React from 'react';
import { Text, View } from 'react-native';
import { PlacePrediction } from '../../../utils/types/types';
import ActionsRow from '../ActionsRow';
import PlaceFilterChip from './PlaceFilterChip';

interface HeaderProps {
  place: PlacePrediction | null;
  setSearching: (value: boolean) => void;
  setPlace: (place: PlacePrediction | null) => void;
}

const FeedHeader: React.FC<HeaderProps> = ({
  place,
  setSearching,
  setPlace,
}) => (
  <>
    <View style={{ alignSelf: 'center', flexDirection: 'row' }}>
      <Text
        style={{
          color: 'white',
          fontSize: 24,
          fontWeight: 'bold',
          paddingHorizontal: 5,
        }}
      >
        Bar
      </Text>
      <View style={{ backgroundColor: '#ffa31a', borderRadius: 5 }}>
        <Text
          style={{
            color: 'black',
            fontSize: 24,
            fontWeight: 'bold',
            paddingHorizontal: 5,
          }}
        >
          hub
        </Text>
      </View>
    </View>
    <ActionsRow setSearching={setSearching} />
    {place && (
      <View style={{ alignSelf: 'flex-start', marginBottom: 5 }}>
        <PlaceFilterChip
          setPlace={setPlace}
          place={place.structuredFormat.mainText.text}
        />
      </View>
    )}
  </>
);

export default FeedHeader;
