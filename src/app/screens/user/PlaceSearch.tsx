import Layout from '../../components/user/Shared/Layout';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { commonAppStyles, formStyles } from '../../utils/styles/styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { fetchPlaceAutocomplete } from '../../utils/helper-functions/fetchPlacesAutocomplete';
import { useUserContext } from '../../providers/UserProvider';
import { PlacePrediction } from '../../utils/types/types';
import MapSearch from '../../components/user/Search/MapSearch';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import {
  primaryColor,
  primaryDeepColor,
  secondaryTextColor,
} from '../../utils/styles/colors';
import { useTranslation } from 'react-i18next';

export const PlaceSearch = () => {
  const { location } = useUserContext();
  const [places, setPlaces] = useState<PlacePrediction[]>([]);
  const [isMapShown, setIsMapShown] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const [place, setPlace] = useState<PlacePrediction>();

  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(1000)).current; // Start position off-screen

  // Slide-in animation when the tab is focused
  useFocusEffect(
    useCallback(() => {
      // Slide in when screen is focused
      Animated.timing(translateY, {
        toValue: 0, // Slide in to the screen
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Return a cleanup function to slide it out when unfocused
      return () => {
        Animated.timing(translateY, {
          toValue: 1000, // Slide out off-screen
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start();
      };
    }, [translateY])
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // If the user swipes down
        return gestureState.dy > 10;
      },
      onPanResponderMove: Animated.event([null, { dy: translateY }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 300) {
          // If the swipe is significant, close the window
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 250,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }).start(() => navigation.navigate('Feed'));
        } else {
          // Otherwise, snap back to the original position
          Animated.timing(translateY, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  function onCancelClick() {
    Animated.timing(translateY, {
      toValue: 1000, // Move back off-screen
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('Feed');
    });
  }

  async function getAutocompletePlaces(searchText: string) {
    const places = await fetchPlaceAutocomplete(searchText, location!);
    if (places) {
      const predicted = places.suggestions?.map(sugs => sugs.placePrediction);
      setPlaces(predicted);
    }
  }

  if (isMapShown)
    return (
      <Layout pageTitle={'Map search'}>
        <MapSearch setIsMapShown={setIsMapShown} setPlace={setPlace} />
      </Layout>
    );

  return (
    <Layout pageTitle="Search places">
      <Animated.View
        style={{ transform: [{ translateY }] }}
        {...panResponder.panHandlers}
      >
        <View
          style={{
            paddingBottom: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <TouchableOpacity onPress={onCancelClick}>
            <FontAwesomeIcon icon={Icons.Remove} size={24} color={'white'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsMapShown(true)}>
            <FontAwesomeIcon icon={Icons.Map} size={24} color={'white'} />
          </TouchableOpacity>
        </View>
        <TextInput
          style={formStyles.inputPrimary}
          placeholder={t('search-place')}
          onChangeText={text => getAutocompletePlaces(text)}
          placeholderTextColor={secondaryTextColor}
        />
        {places?.map((place, index) => (
          <Pressable
            key={index}
            // style={{ padding: 15 }}
            style={({ pressed }) => [
              {
                padding: pressed ? 16 : 16,
              },
            ]}
            onPress={() => {
              navigation.navigate('Feed', { selectedPlace: place }); // Navigate back to Feed and pass place
            }}
          >
            {({ pressed }) => (
              <View>
                <Text
                  style={[
                    { fontSize: 14, fontWeight: 'bold' },
                    pressed ? { color: primaryColor } : { color: 'white' }, // Conditional styling
                  ]}
                >
                  {place.structuredFormat.mainText.text}
                </Text>
                <Text
                  style={[
                    { fontSize: 12 },
                    pressed ? { color: primaryDeepColor } : { color: 'grey' },
                  ]}
                >
                  {place.structuredFormat.secondaryText.text}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </Animated.View>
    </Layout>
  );
};

export default PlaceSearch;
