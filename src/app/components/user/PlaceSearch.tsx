import Layout from './Layout';
import {
  Animated,
  Easing,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { commonAppStyles, formStyles } from '../../utils/styles/styles';
import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { fetchPlaceAutocomplete } from '../../utils/helper-functions/fetchPlacesAutocomplete';
import { useUserContext } from '../../providers/UserProvider';
import { PlacePrediction } from '../../utils/types/types';

type LayoutProps = {
  setSearching: (isSearching: boolean) => void;
};

export const PlaceSearch = (props: LayoutProps) => {
  const { location } = useUserContext();
  const [places, setPlaces] = useState<PlacePrediction[]>([]);
  const translateY = useRef(new Animated.Value(1000)).current; // Start position is off-screen

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  function onCancelClick() {
    Animated.timing(translateY, {
      toValue: 1000, // Move back off-screen
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      props.setSearching(false);
    });
  }

  async function getAutocompletePlaces(searchText: string) {
    const places = await fetchPlaceAutocomplete(searchText, location!);
    if (places) {
      const predicted = places.suggestions.map(sugs => sugs.placePrediction);
      setPlaces(predicted);
      console.log(predicted);
    }
  }

  return (
    <Layout pageTitle="Search places">
      <Animated.View style={{ transform: [{ translateY }] }}>
        <TouchableOpacity
          style={{ paddingVertical: 20 }}
          onPress={onCancelClick}
        >
          <FontAwesomeIcon icon={Icons.X} size={24} color={'white'} />
        </TouchableOpacity>
        <TextInput
          style={formStyles.inputPrimary}
          onChangeText={text => getAutocompletePlaces(text)}
        />
        {places.map((place, index) => (
          <TouchableOpacity key={index} style={{ padding: 15 }}>
            <Text
              style={[
                commonAppStyles.textPrimary,
                { fontSize: 14, fontWeight: 'bold' },
              ]}
            >
              {place.structuredFormat.mainText.text}
            </Text>
            <Text
              style={[
                commonAppStyles.textPrimary,
                { fontSize: 12, color: 'grey' },
              ]}
            >
              {place.structuredFormat.secondaryText.text}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Layout>
  );
};

export default PlaceSearch;
