import React from 'react';
import { View } from 'react-native';
import PlaceFilterChip from './PlaceFilterChip';

interface HeaderProps {
  placeName: string | null;
}

const FeedHeader = ({ placeName }: HeaderProps) => {
  return (
    <>
      {placeName && (
        <View style={{ alignSelf: 'flex-start', marginBottom: 5 }}>
          <PlaceFilterChip place={placeName} />
        </View>
      )}
    </>
  );
};

export default FeedHeader;
