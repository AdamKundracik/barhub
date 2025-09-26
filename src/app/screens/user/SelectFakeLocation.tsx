import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { formStyles } from '../../utils/styles/styles';
import { primaryColor, primaryDeepColor } from '../../utils/styles/colors';
import { useLocationStore } from '../../utils/store/locationStore';
import { useTranslation } from 'react-i18next';
import { FormControl } from '@/components/ui/form-control';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { XIcon } from 'lucide-react-native';

export const SelectFakeLocation = () => {
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setFakeLocation, setFakeLocationName } = useLocationStore();

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
          )}&types=(cities)&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}`
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

  const handlePlaceSelect = async (place: any) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}`
      );
      const details = await res.json();
      const location = details.result.geometry.location;

      setFakeLocation({ latitude: location.lat, longitude: location.lng });
      setFakeLocationName(place.description);

      navigation.goBack();
    } catch (e) {
      console.error('Error fetching place details', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title={t('select-city')}
      clickFunction={() => navigation.goBack()}
    >
      <FormControl
        size="lg"
        isDisabled={false}
        isReadOnly={false}
        isRequired={false}
        style={formStyles.formControl}
      >
        <Input
          className="my-1"
          variant="rounded"
          size="xl"
          style={{
            borderRadius: 25,
            borderColor: primaryDeepColor,
            borderWidth: 3,
            backgroundColor: 'white',
          }}
        >
          <InputField
            type="text"
            placeholder="Zadaj mesto"
            placeholderTextColor={primaryDeepColor}
            value={query}
            autoCorrect={false}
            autoCapitalize="none"
            onChangeText={text => {
              setQuery(text);
              if (!text) setHasSearched(false);
            }}
            style={{ backgroundColor: 'white' }}
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
              <InputIcon as={XIcon} size={'xl'} color={'black'} />
            </InputSlot>
          )}
        </Input>
      </FormControl>

      {loading && <Text style={styles.loadingText}>Načítavam...</Text>}

      {!loading && places.length > 0 ? (
        places.map(place => (
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
      ) : hasSearched && !loading ? (
        <View style={styles.noResults}>
          <Text style={{ color: 'white' }}>Nenašli sa žiadne výsledky</Text>
        </View>
      ) : null}
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
