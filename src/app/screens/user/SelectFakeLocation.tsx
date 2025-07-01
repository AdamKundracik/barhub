import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../../components/user/Shared/ScreenLayout';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { formStyles } from '../../utils/styles/styles';
import { primaryColor, primaryDeepColor } from '../../utils/styles/colors';
import { useLocationStore } from '../../utils/store/locationStore';
import { googleAPIKey } from '../../utils/helper-functions/constants';

export const SelectFakeLocation = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setFakeLocation } = useLocationStore();

  // Debounce the query input by 300ms
  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setHasSearched(query.trim().length > 0);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [query]);

  // Fetch autocomplete places when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) {
      setPlaces([]);
      return;
    }

    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            debouncedQuery
          )}&types=(cities)&key=${googleAPIKey}`
        );
        const json = await res.json();
        setPlaces(json.predictions || []);
      } catch (e) {
        console.error('Error fetching places', e);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [debouncedQuery]);

  // Handle selection of place, fetch details and update fake location
  const handlePlaceSelect = async (place: any) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${googleAPIKey}`
      );
      const details = await res.json();
      const location = details.result.geometry.location;

      setFakeLocation(
        { latitude: location.lat, longitude: location.lng },
        place.description
      );

      navigation.goBack();
    } catch (e) {
      console.error('Error fetching place details', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Select Location"
      clickFunction={() => navigation.goBack()}
    >
      <View style={{ position: 'relative' }}>
        <TextInput
          style={[formStyles.inputPrimary, styles.input]}
          placeholder="Zadaj mesto"
          placeholderTextColor={primaryDeepColor}
          onChangeText={text => {
            setQuery(text);
            if (!text) setHasSearched(false);
          }}
          value={query}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setQuery('');
              setHasSearched(false);
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

      {loading && <Text style={styles.loadingText}>Načítavam...</Text>}

      {!loading && places.length > 0
        ? places.map(place => (
            <Pressable
              key={place.place_id}
              onPress={() => handlePlaceSelect(place)}
              style={[styles.placeItem]}
            >
              {({ pressed }) => (
                <Text
                  style={[
                    styles.placeText,
                    { color: pressed ? primaryColor : 'white' },
                  ]}
                >
                  {place.description}
                </Text>
              )}
            </Pressable>
          ))
        : hasSearched &&
          !loading && (
            <View style={styles.noResults}>
              <Text style={{ color: 'white' }}>Nenašli sa žiadne výsledky</Text>
            </View>
          )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'white',
    color: primaryDeepColor,
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    top: 14,
    zIndex: 10,
  },
  loadingText: {
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
  },
  placeItem: {
    padding: 16,
    borderRadius: 6,
  },
  placeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noResults: {
    padding: 16,
  },
});

export default SelectFakeLocation;
