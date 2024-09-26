import {
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useTranslation } from 'react-i18next';
import { generateId } from '../../utils/helper-functions/generate-hash';
import { usePlaceStore } from '../../utils/store/placesStore';
import { useUserContext } from '../../providers/UserProvider';
import { useQuery } from 'react-query';
import { fetchPlaceAutocomplete } from '../../utils/helper-functions/fetchPlacesAutocomplete';
import {
  primaryColor,
  primaryDeepColor,
  secondaryTextColor,
  textInputPlaceholderColor,
} from '../../utils/styles/colors';
import Layout from '../../components/user/Shared/Layout';
import MapSearch from '../../components/user/Search/MapSearch';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { formStyles } from '../../utils/styles/styles';

export const PlaceSearch = () => {
  const [isMapShown, setIsMapShown] = useState<boolean>(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [hasSearched, setHasSearched] = useState(false); // Track if the user has started searching
  const navigation = useNavigation<NavigationProp<UserStackList>>();
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
        setHasSearched(true); // User has started searching
      }
    }, 300);
  }, [query]);

  const { data: places } = usePlaceAutocomplete(debouncedQuery, sessionToken);

  if (isMapShown)
    return (
      <Layout pageTitle={'Map search'}>
        <MapSearch setIsMapShown={setIsMapShown} />
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

        <View style={{ position: 'relative' }}>
          <TextInput
            style={[
              formStyles.inputPrimary,
              { backgroundColor: 'white', color: primaryDeepColor },
            ]}
            placeholder={t('search-place')}
            onChangeText={text => {
              setQuery(text);
              if (!text) setHasSearched(false); // Reset if input is cleared
            }}
            value={query}
            placeholderTextColor={primaryDeepColor}
          />
          {query.length > 0 && (
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 16, // Adjust according to your design
                top: 14, // Adjust according to your design
              }}
              onPress={() => {
                setQuery(''); // Clear the input field
                setHasSearched(false); // Reset search state
              }}
            >
              <FontAwesomeIcon
                icon={Icons.Remove}
                size={24}
                color={primaryDeepColor}
              />
            </TouchableOpacity>
          )}
        </View>

        {places?.suggestions && places.suggestions.length > 0
          ? places.suggestions.map((place, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  {
                    padding: 16,
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
                        { color: pressed ? primaryColor : 'white' }, // Conditional styling for color
                      ]}
                    >
                      {place.placePrediction.structuredFormat.mainText.text}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 12 },
                        { color: pressed ? primaryDeepColor : 'grey' }, // Conditional styling for color
                      ]}
                    >
                      {
                        place.placePrediction.structuredFormat.secondaryText
                          .text
                      }
                    </Text>
                  </View>
                )}
              </Pressable>
            ))
          : hasSearched && (
              <View style={{ padding: 16 }}>
                <Text style={{ color: 'white' }}>No results</Text>
              </View>
            )}
      </View>
    </Layout>
  );
};

export default PlaceSearch;
