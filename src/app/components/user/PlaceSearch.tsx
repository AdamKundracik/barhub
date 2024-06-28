import Layout from './Layout';
import {
  Animated,
  Easing,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { commonAppStyles, formStyles } from '../../utils/styles/styles';
import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { fetchPlaceAutocomplete } from '../../utils/helper-functions/fetchPlacesAutocomplete';
import { useUserContext } from '../../providers/UserProvider';
import { PlacePrediction } from '../../utils/types/types';
import MapSearch from './MapSearch';

type LayoutProps = {
  setSearching: (isSearching: boolean) => void;
  setPlace: (place: PlacePrediction) => void;
};

export const PlaceSearch = (props: LayoutProps) => {
  const { location } = useUserContext();
  const [places, setPlaces] = useState<PlacePrediction[]>([]);
  const [isMapShown, setIsMapShown] = useState<boolean>(false);

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
    }
  }

  if (isMapShown)
    return (
      <Layout pageTitle={'Map search'}>
        <MapSearch
          setIsMapShown={setIsMapShown}
          setPlace={props.setPlace}
          setIsSearching={props.setSearching}
        />
      </Layout>
    );

  return (
    <Layout pageTitle="Search places">
      <Animated.View style={{ transform: [{ translateY }] }}>
        <View
          style={{
            paddingVertical: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <TouchableOpacity onPress={onCancelClick}>
            <FontAwesomeIcon icon={Icons.X} size={24} color={'white'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsMapShown(true)}>
            <FontAwesomeIcon icon={Icons.Map} size={24} color={'white'} />
          </TouchableOpacity>
        </View>
        <TextInput
          style={formStyles.inputPrimary}
          placeholder={'Search for your place'}
          onChangeText={text => getAutocompletePlaces(text)}
        />
        {places.map((place, index) => (
          <TouchableOpacity
            key={index}
            style={{ padding: 15 }}
            onPress={() => {
              props.setPlace(place);
              onCancelClick();
            }}
          >
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
