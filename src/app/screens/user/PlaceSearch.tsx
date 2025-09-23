import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { useTranslation } from 'react-i18next';
import { generateId } from '../../utils/helper-functions/generate-hash';
import { usePlaceStore } from '../../utils/store/placesStore';
import { useQuery } from 'react-query';
import { primaryColor, primaryDeepColor } from '../../utils/styles/colors';
import Layout from '@/src/app/components/shared/Layouts/Layout';
import MapSearch from '../../components/user/Search/MapSearch';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { fetchPlaceAutocomplete } from '../../utils/helper-functions/fetchPlacesAPI';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { XIcon } from 'lucide-react-native';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { useUserStore } from '@/src/app/utils/store/userStore';
import InlineAd from '@/src/app/components/user/Ad';

export const PlaceSearch = () => {
  const [isMapShown, setIsMapShown] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [hasSearched, setHasSearched] = useState(false);

  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const [sessionToken] = useState(generateId());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setPlaceId, setPlaceName } = usePlaceStore();
  const { addToSearchHistory, searchHistory, premium } = useUserStore();

  /** Cancel search */
  function onCancelClick() {
    navigation.goBack();
  }

  /** Fetch places autocomplete */
  const usePlaceAutocomplete = (query: string, sessionToken: string) => {
    const { location } = useLocationStore();
    return useQuery(
      ['places-autocomplete', query],
      () => fetchPlaceAutocomplete(query, location!, sessionToken),
      { enabled: query.length >= 2 }
    );
  };

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      if (query) {
        setDebouncedQuery(query);
        setHasSearched(true);
      }
    }, 300);
  }, [query]);

  const { data: places } = usePlaceAutocomplete(debouncedQuery, sessionToken);

  /** Handle place selection */
  const handlePlaceSelect = async (place: any, fromHistory = false) => {
    Keyboard.dismiss();

    let placeId: string;
    let mainText: string;
    let secondaryText: string;

    if (fromHistory) {
      placeId = place.placeId;
      mainText = place.mainText;
      secondaryText = place.secondaryText;
    } else {
      placeId = place.placePrediction.placeId;
      mainText = place.placePrediction.structuredFormat.mainText.text;
      secondaryText = place.placePrediction.structuredFormat.secondaryText.text;
    }
    setPlaceId(placeId);
    setPlaceName(mainText);
    if (!fromHistory) {
      await addToSearchHistory({ placeId, mainText, secondaryText });
    }
    navigation.navigate('Feed');
  };

  /** Render results */
  const renderPlaces = () => {
    if (query.length === 0) {
      // Ak nie je query, ukáž históriu
      if (searchHistory.length > 0) {
        return (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {searchHistory.map((place, index) => (
              <Pressable
                key={index}
                style={{ padding: 16 }}
                onPress={() => handlePlaceSelect(place, true)}
              >
                {({ pressed }) => (
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: pressed ? primaryColor : 'white',
                      }}
                    >
                      {place.mainText}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: pressed ? primaryDeepColor : 'grey',
                      }}
                    >
                      {place.secondaryText}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        );
      }
      return null;
    }

    if (places && places?.suggestions?.length > 0) {
      return (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {places.suggestions.map((place, index) => (
            <Pressable
              key={index}
              style={{ padding: 16 }}
              onPress={() => handlePlaceSelect(place)}
            >
              {({ pressed }) => (
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: pressed ? primaryColor : 'white',
                    }}
                  >
                    {place.placePrediction.structuredFormat.mainText.text}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: pressed ? primaryDeepColor : 'grey',
                    }}
                  >
                    {place.placePrediction.structuredFormat.secondaryText.text}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      );
    }

    if (hasSearched) {
      return (
        <View style={{ padding: 16 }}>
          <Text style={{ color: 'white' }}>{t('no-results')}</Text>
        </View>
      );
    }

    return null;
  };

  if (isMapShown) {
    return (
      <Layout pageTitle="Map search" showTopBar={false}>
        <MapSearch setIsMapShown={setIsMapShown} />
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Search places" showTopBar={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <>
            <View style={{ flex: 1, paddingHorizontal: 16 }}>
              {/* Top buttons */}
              <View
                style={{
                  paddingBottom: 20,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <TouchableOpacity onPress={onCancelClick}>
                  <FontAwesomeIcon
                    icon={Icons.Remove}
                    size={28}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsMapShown(true)}>
                  <FontAwesomeIcon icon={Icons.Map} size={24} color="white" />
                </TouchableOpacity>
              </View>

              {/* Search input */}
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
                    value={query}
                    onChangeText={text => {
                      setQuery(text);
                      if (!text) setHasSearched(false);
                    }}
                    placeholderTextColor={primaryDeepColor}
                    size="lg"
                    style={{
                      color: primaryDeepColor,
                      borderBlockColor: primaryColor,
                    }}
                  />
                  {query.length > 0 && (
                    <InputSlot
                      className="pr-3"
                      style={{ backgroundColor: 'white' }}
                      onPress={() => {
                        setQuery('');
                        setHasSearched(false);
                      }}
                    >
                      <InputIcon as={XIcon} size="xl" color="black" />
                    </InputSlot>
                  )}
                </Input>
              </View>

              {/* Results */}
              <View style={{ flex: 1, marginTop: 16 }}>{renderPlaces()}</View>
            </View>

            {/* Banner Ad na spodok */}
            {!premium && <InlineAd />}
          </>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Layout>
  );
};

export default PlaceSearch;
