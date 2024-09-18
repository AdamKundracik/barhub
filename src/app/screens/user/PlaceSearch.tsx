import Layout from '../../components/user/Shared/Layout';
import {
  Animated,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { formStyles } from '../../utils/styles/styles';
import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { fetchPlaceAutocomplete } from '../../utils/helper-functions/fetchPlacesAutocomplete';
import { useUserContext } from '../../providers/UserProvider';
import { PlacePrediction } from '../../utils/types/types';
import MapSearch from '../../components/user/Search/MapSearch';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import {
  primaryColor,
  primaryDeepColor,
  secondaryTextColor,
} from '../../utils/styles/colors';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import useDebounce from '../../utils/hooks/useDebounce';
import { generateId } from '../../utils/helper-functions/generate-hash';
import { usePlaceStore } from '../../utils/store/placesStore';

export const PlaceSearch = () => {
  const [isMapShown, setIsMapShown] = useState<boolean>(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const [place, setPlace] = useState<string>();
  const { t } = useTranslation();
  const [sessionToken] = useState(generateId()); // Generate a unique session token
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setPlaceId, setPlaceName } = usePlaceStore();

  function onCancelClick() {
    navigation.goBack();
  }

  const usePlaceAutocomplete = (query: string, sessionToken: string) => {
    const { location } = useUserContext(); // Assuming location is available here

    return useQuery(
      ['places-autocomplete', query], // Query key for caching
      () => fetchPlaceAutocomplete(query.toUpperCase(), location, sessionToken), // Fetch places using your function
      {
        enabled: query.length >= 2, // Enable query only if query is 3+ chars and location is available
        staleTime: 5 * 60 * 1000, // Cache results for 5 minutes
        refetchOnWindowFocus: false, // Do not refetch on window focus
        retry: 2, // Retry twice on failure
      }
    );
  };

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (query) {
        setDebouncedQuery(query);
      }
    }, 300);
  }, [query]);

  const {
    data: places,
    isLoading,
    isError,
  } = usePlaceAutocomplete(debouncedQuery, sessionToken);

  if (isMapShown)
    return (
      <Layout pageTitle={'Map search'}>
        <MapSearch setIsMapShown={setIsMapShown} setPlaceId={setPlace} />
      </Layout>
    );

  return (
    <Layout pageTitle="Search places">
      <View>
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
          onChangeText={text => setQuery(text)}
          placeholderTextColor={secondaryTextColor}
        />
        {places?.suggestions?.map((place, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              {
                padding: pressed ? 16 : 16,
              },
            ]}
            onPress={() => {
              navigation.navigate('Feed');
              setPlaceId(place.placePrediction.placeId);
              setPlaceName(
                place.placePrediction.structuredFormat.mainText.text
              );
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
                  {place.placePrediction.structuredFormat.mainText.text}
                </Text>
                <Text
                  style={[
                    { fontSize: 12 },
                    pressed ? { color: primaryDeepColor } : { color: 'grey' },
                  ]}
                >
                  {place.placePrediction.structuredFormat.secondaryText.text}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </Layout>
  );
};

export default PlaceSearch;
