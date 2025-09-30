import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Pressable, 
  StyleSheet, 
  Text, 
  View, 
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { formStyles } from '../../utils/styles/styles';
import { 
  primaryColor, 
  primaryDeepColor, 
  primaryTextColor,
  separatorColor,
  postBgColor
} from '../../utils/styles/colors';
import { useLocationStore } from '../../utils/store/locationStore';
import { useTranslation } from 'react-i18next';
import { FormControl } from '@/components/ui/form-control';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { XIcon, SearchIcon, MapPinIcon, AlertCircleIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCustomToast } from '../../components/shared/Toaster';
import LoadingIndicator from '../../components/user/NewsFeed/LoadingIndicator';
import { generateUID } from '../../utils/helper-functions/generateUID';

const { width: screenWidth } = Dimensions.get('window');

// Interfaces for old Google Places API (for cities/geocoding)
interface CityPrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetailsResponse {
  status: string;
  result?: {
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
  };
  error_message?: string;
}

export const SelectFakeLocation = () => {
  const { t } = useTranslation();
  const { showErrorToast, showSuccessToast } = useCustomToast();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [places, setPlaces] = useState<CityPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const navigation = useNavigation();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setFakeLocation, setFakeLocationName } = useLocationStore();
  const { location } = useLocationStore();
  const sessionToken = useRef(generateUID()).current;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setPlaces([]);
      setError(null);
      return;
    }

    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use old Google Places API for cities/geocoding
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          debouncedQuery
        )}&types=(cities)&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}&sessiontoken=${sessionToken}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'OK') {
          setPlaces(data.predictions || []);
        } else if (data.status === 'ZERO_RESULTS') {
          setPlaces([]);
        } else {
          throw new Error(data.error_message || 'API Error');
        }
      } catch (e) {
        console.error('Error fetching places', e);
        setError(t('network-error'));
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [debouncedQuery, t, sessionToken]);

  const handlePlaceSelect = useCallback(async (place: CityPrediction) => {
    if (isSelecting) return; // Prevent double selection
    
    setIsSelecting(true);
    Keyboard.dismiss();
    
    try {
      // Use old Google Places API for place details
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}&sessiontoken=${sessionToken}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const details: PlaceDetailsResponse = await response.json();
      
      if (details.status === 'OK' && details.result?.geometry?.location) {
        const location = details.result.geometry.location;
        
        setFakeLocation({ latitude: location.lat, longitude: location.lng });
        setFakeLocationName(place.description);
        
        showSuccessToast(
          t('Selected-location'),
          place.description
        );
        
        // Small delay for better UX
        setTimeout(() => {
          navigation.goBack();
        }, 500);
      } else {
        throw new Error(details.error_message || 'Invalid response');
      }
    } catch (e) {
      console.error('Error fetching place details', e);
      showErrorToast(t('error'), t('something-went-wrong'));
    } finally {
      setIsSelecting(false);
    }
  }, [isSelecting, setFakeLocation, setFakeLocationName, t, navigation, sessionToken]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setHasSearched(false);
    setError(null);
    Keyboard.dismiss();
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <ScreenLayout
        title={t('select-city')}
        showTitle 
        showBackButton
        onBackPress={() => navigation.goBack()}
      >
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <FormControl
              size="lg"
              isDisabled={isSelecting}
              isReadOnly={false}
              isRequired={false}
              style={styles.formControl}
            >
              <Input
                className="my-1"
                variant="rounded"
                size="xl"
                style={styles.searchInput}
              >
                <InputSlot className="pl-4">
                  <InputIcon 
                    as={SearchIcon} 
                    size={'lg'} 
                    color={primaryColor} 
                  />
                </InputSlot>
                <InputField
                  type="text"
                  placeholder={t('search')}
                  placeholderTextColor={separatorColor}
                  value={query}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  onChangeText={text => {
                    setQuery(text);
                    if (!text) {
                      setHasSearched(false);
                      setError(null);
                    }
                  }}
                  style={styles.inputField}
                  editable={!isSelecting}
                />
                {query.length > 0 && (
                  <InputSlot
                    className="pr-4"
                    style={styles.clearButton}
                    onPress={handleClearSearch}
                    disabled={isSelecting}
                  >
                    <InputIcon 
                      as={XIcon} 
                      size={'lg'} 
                      color={separatorColor} 
                    />
                  </InputSlot>
                )}
              </Input>
            </FormControl>
            
            {/* Search hint */}
            {!hasSearched && !query && (
              <Text style={styles.searchHint}>
                {t('search')} {t('select-city').toLowerCase()}
              </Text>
            )}
          </View>

          {/* Content Area */}
          <ScrollView 
            style={styles.contentArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Loading State */}
            {loading && (
              <View style={styles.loadingContainer}>
                <LoadingIndicator />
                <Text style={styles.loadingText}>
                  {t('search')}...
                </Text>
              </View>
            )}

            {/* Results */}
            {!loading && places.length > 0 && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsHeader}>
                  {places.length} {places.length === 1 ? 'výsledok' : 'výsledkov'}
                </Text>
                {places.map((place, index) => (
                  <Pressable
                    key={place.place_id}
                    onPress={() => handlePlaceSelect(place)}
                    style={styles.placeItem}
                    disabled={isSelecting}
                  >
                    {({ pressed }) => (
                      <LinearGradient
                        colors={pressed ? [primaryColor + '20', primaryColor + '10'] : ['transparent', 'transparent']}
                        style={styles.placeItemGradient}
                      >
                        <View style={styles.placeItemContent}>
                          <View style={styles.placeIconContainer}>
                            <MapPinIcon 
                              size={20} 
                              color={primaryColor} 
                            />
                          </View>
                          <View style={styles.placeTextContainer}>
                            <Text
                              style={[
                                styles.placeText,
                                { color: pressed ? primaryColor : primaryTextColor },
                              ]}
                              numberOfLines={2}
                            >
                              {place.description}
                            </Text>
                            {place.structured_formatting?.secondary_text && (
                              <Text style={styles.placeSecondaryText}>
                                {place.structured_formatting.secondary_text}
                              </Text>
                            )}
                          </View>
                          {isSelecting && (
                            <View style={styles.selectingIndicator}>
                              <LoadingIndicator />
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* Empty State */}
            {!loading && hasSearched && places.length === 0 && !error && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <SearchIcon size={48} color={separatorColor} />
                </View>
                <Text style={styles.emptyTitle}>{t('no-results')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('search')} {t('select-city').toLowerCase()}
                </Text>
              </View>
            )}

            {/* Error State */}
            {!loading && error && (
              <View style={styles.errorState}>
                <View style={styles.errorIconContainer}>
                  <AlertCircleIcon size={48} color="#ef4444" />
                </View>
                <Text style={styles.errorTitle}>{t('error')}</Text>
                <Text style={styles.errorSubtitle}>{error}</Text>
                <Pressable 
                  style={styles.retryButton}
                  onPress={() => {
                    if (debouncedQuery) {
                      setError(null);
                      // Trigger refetch by updating debounced query
                      const currentQuery = debouncedQuery;
                      setDebouncedQuery('');
                      setTimeout(() => setDebouncedQuery(currentQuery), 100);
                    }
                  }}
                >
                  <Text style={styles.retryButtonText}>{t('please-try-again-later')}</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </ScreenLayout>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  searchContainer: {
    marginBottom: 20,
  },
  formControl: {
    marginBottom: 8,
  },
  searchInput: {
    borderRadius: 25,
    borderColor: primaryDeepColor,
    borderWidth: 2,
    backgroundColor: 'white',
    shadowColor: primaryColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputField: {
    backgroundColor: 'white',
    color: primaryDeepColor,
    fontSize: 16,
    paddingLeft: 8,
  },
  clearButton: {
    backgroundColor: 'white',
  },
  searchHint: {
    color: separatorColor,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: primaryTextColor,
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    color: separatorColor,
    fontSize: 14,
    marginBottom: 12,
    paddingHorizontal: 4,
    fontWeight: '500',
  },
  placeItem: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: postBgColor,
    borderWidth: 1,
    borderColor: separatorColor + '20',
  },
  placeItemGradient: {
    padding: 16,
  },
  placeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeIconContainer: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  placeTextContainer: {
    flex: 1,
  },
  placeText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  placeSecondaryText: {
    fontSize: 14,
    color: separatorColor,
    marginTop: 2,
    lineHeight: 18,
  },
  selectingIndicator: {
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: primaryTextColor,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: separatorColor,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: separatorColor,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: primaryColor,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SelectFakeLocation;