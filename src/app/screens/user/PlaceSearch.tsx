import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useTranslation } from 'react-i18next';
import { generateId } from '../../utils/helper-functions/generate-hash';
import { usePlaceStore } from '../../utils/store/placesStore';
import { useQuery } from 'react-query';
import { primaryColor, primaryDeepColor } from '../../utils/styles/colors';
import Layout from '../../components/user/Shared/Layout';
import MapSearch from '../../components/user/Search/MapSearch';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { fetchPlaceAutocomplete } from '../../utils/helper-functions/fetchPlacesAPI';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { XIcon } from 'lucide-react-native';
import { useLocationStore } from '@/src/app/utils/store/locationStore';

export const PlaceSearch = () => {
  const [isMapShown, setIsMapShown] = useState<boolean>(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [hasSearched, setHasSearched] = useState(false);
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const [sessionToken] = useState(generateId());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setPlaceId, setPlaceName } = usePlaceStore();

  function onCancelClick() {
    navigation.goBack();
  }

  const usePlaceAutocomplete = (query: string, sessionToken: string) => {
    const { location } = useLocationStore();

    return useQuery(
      ['places-autocomplete', query],
      () => fetchPlaceAutocomplete(query, location!, sessionToken),
      {
        enabled: query.length >= 2,
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
        setHasSearched(true);
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
            <FontAwesomeIcon icon={Icons.Remove} size={28} color={'white'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsMapShown(true)}>
            <FontAwesomeIcon icon={Icons.Map} size={24} color={'white'} />
          </TouchableOpacity>
        </View>

        <View style={{ position: 'relative' }}>
          <Input
            size="xl"
            style={{
              borderRadius: 25,
              borderColor: primaryDeepColor,
              borderWidth: 3,
              backgroundColor: 'white',
            }}
          >
            <InputField
              variant="rounded"
              placeholder={t('search-place')}
              onChangeText={text => {
                setQuery(text);
                if (!text) setHasSearched(false);
              }}
              value={query}
              placeholderTextColor={primaryDeepColor}
              size="lg"
              style={[
                {
                  color: primaryDeepColor,
                  borderBlockColor: primaryColor,
                },
              ]}
            ></InputField>
            {query.length > 0 && (
              <InputSlot
                className="pr-3"
                style={{ backgroundColor: 'white' }}
                onPress={() => {
                  setQuery('');
                  setHasSearched(false);
                }}
              >
                <InputIcon as={XIcon} size={'xl'} color={'black'} />
              </InputSlot>
            )}
          </Input>
        </View>

        {places?.suggestions && places.suggestions.length > 0
          ? places.suggestions.map((place, index) => (
              <Pressable
                key={index}
                style={[
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
                        { color: pressed ? primaryColor : 'white' },
                      ]}
                    >
                      {place.placePrediction.structuredFormat.mainText.text}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 12 },
                        { color: pressed ? primaryDeepColor : 'grey' },
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
                <Text style={{ color: 'white' }}>{t('no-results')}</Text>
              </View>
            )}
      </View>
    </Layout>
  );
};

export default PlaceSearch;
