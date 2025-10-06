import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { ClockIcon, MapPinIcon, XIcon } from 'lucide-react-native';

// UI Components
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import Layout from '@/src/app/components/shared/Layouts/Layout';
import MapSearch from '../../components/user/Search/MapSearch';
import InlineAd from '@/src/app/components/user/InlineAd';

// Store and utilities
import { usePlaceStore } from '../../utils/store/placesStore';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { useUserData } from '@/src/app/hooks/useUserQuery';
import { UserStackList } from '../../utils/types/screen-types';
import { fetchPlaceAutocomplete } from '../../utils/helper-functions/fetchPlacesAPI';
import { generateUID } from '@/src/app/utils/helper-functions/generateUID';
import { Icons } from '../../utils/icons/icons';
import { primaryColor, primaryDeepColor } from '../../utils/styles/colors';

// Types
interface PlaceSuggestion {
  placePrediction: {
    placeId: string;
    structuredFormat: {
      mainText: { text: string };
      secondaryText: { text: string };
    };
  };
}

interface HistoryPlace {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

// Custom hooks
const usePlaceAutocomplete = (query: string, sessionToken: string) => {
  const { location } = useLocationStore();
  return useQuery(
    ['places-autocomplete', query],
    () => fetchPlaceAutocomplete(query, location!, sessionToken),
    {
      enabled: query.length >= 2 && !!location,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Components
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.emptyStateContainer}>
    <MapPinIcon size={48} color={primaryColor} />
    <Text style={styles.emptyStateText}>{message}</Text>
  </View>
);

const LoadingIndicator: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="small" color={primaryColor} />
    <Text style={styles.loadingText}>Hľadám miesta...</Text>
  </View>
);

const PlaceItem: React.FC<{
  mainText: string;
  secondaryText: string;
  onPress: () => void;
  isHistory?: boolean;
}> = ({ mainText, secondaryText, onPress, isHistory = false }) => (
  <Pressable style={styles.placeItem} onPress={onPress}>
    {({ pressed }) => (
      <View
        style={[styles.placeItemContent, pressed && styles.placeItemPressed]}
      >
        <View style={styles.placeIconContainer}>
          {isHistory ? (
            <ClockIcon size={20} color={primaryColor} />
          ) : (
            <MapPinIcon size={20} color={primaryColor} />
          )}
        </View>
        <View style={styles.placeTextContainer}>
          <Text style={[styles.placeMainText, pressed && styles.textPressed]}>
            {mainText}
          </Text>
          <Text
            style={[
              styles.placeSecondaryText,
              pressed && styles.secondaryTextPressed,
            ]}
          >
            {secondaryText}
          </Text>
        </View>
      </View>
    )}
  </Pressable>
);

const SearchInput: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder: string;
}> = ({ value, onChangeText, onClear, placeholder }) => (
  <View style={styles.searchInputContainer}>
    <Input size="xl" style={styles.searchInput}>
      <InputField
        variant="rounded"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={primaryDeepColor}
        style={styles.inputField}
        autoFocus
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value.length > 0 && (
        <InputSlot style={styles.clearButton} onPress={onClear}>
          <InputIcon as={XIcon} size="lg" color={primaryDeepColor} />
        </InputSlot>
      )}
    </Input>
  </View>
);

// Main component
export const PlaceSearch: React.FC = () => {
  const [isMapShown, setIsMapShown] = useState(false);
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const sessionToken = useMemo(() => generateUID(), []);

  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const { setPlaceId, setPlaceName } = usePlaceStore();
  const { addSearchHistoryItemAsync, userData, isPremium } = useUserData();

  // Get search history from userData
  const searchHistory = userData?.searchHistory || [];

  const debouncedQuery = useDebounce(query, 300);
  const {
    data: places,
    isLoading,
    error,
  } = usePlaceAutocomplete(debouncedQuery, sessionToken);

  // Effects
  useEffect(() => {
    if (query && !hasSearched) {
      setHasSearched(true);
    }
  }, [query, hasSearched]);

  // Handlers
  const handlePlaceSelect = useCallback(
    async (place: PlaceSuggestion | HistoryPlace, fromHistory = false) => {
      Keyboard.dismiss();

      let placeId: string;
      let mainText: string;
      let secondaryText: string;

      if (fromHistory) {
        const historyPlace = place as HistoryPlace;
        placeId = historyPlace.placeId;
        mainText = historyPlace.mainText;
        secondaryText = historyPlace.secondaryText;
      } else {
        const suggestion = place as PlaceSuggestion;
        placeId = suggestion.placePrediction.placeId;
        mainText = suggestion.placePrediction.structuredFormat.mainText.text;
        secondaryText =
          suggestion.placePrediction.structuredFormat.secondaryText.text;
      }

      setPlaceId(placeId);
      setPlaceName(mainText);

      if (!fromHistory) {
        try {
          await addSearchHistoryItemAsync({ placeId, mainText, secondaryText });
        } catch (error) {
          console.error('Error adding to search history:', error);
          // Continue navigation even if search history fails
        }
      }

      navigation.navigate('Feed');
    },
    [setPlaceId, setPlaceName, addSearchHistoryItemAsync, navigation]
  );

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setHasSearched(false);
  }, []);

  const handleShowMap = useCallback(() => {
    setIsMapShown(true);
  }, []);

  // Render methods
  const renderSearchHistory = useCallback(() => {
    if (searchHistory.length === 0) {
      return (
        <EmptyState
          message={t('no-search-history') || 'Žiadna história vyhľadávania'}
        />
      );
    }

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Nedávno vyhľadané</Text>
        {searchHistory.slice(0, 5).map((place, index) => (
          <PlaceItem
            key={`history-${index}`}
            mainText={place.mainText}
            secondaryText={place.secondaryText}
            onPress={() => handlePlaceSelect(place, true)}
            isHistory
          />
        ))}
      </View>
    );
  }, [searchHistory, handlePlaceSelect, t]);

  const renderSearchResults = useCallback(() => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    if (error) {
      return <EmptyState message="Nastala chyba pri vyhľadávaní" />;
    }

    if (places && places?.suggestions?.length > 0) {
      return (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Výsledky vyhľadávania</Text>
          {places?.suggestions.map((place, index) => (
            <PlaceItem
              key={`result-${index}`}
              mainText={place.placePrediction.structuredFormat.mainText.text}
              secondaryText={
                place.placePrediction.structuredFormat.secondaryText.text
              }
              onPress={() => handlePlaceSelect(place)}
            />
          ))}
        </View>
      );
    }

    if (hasSearched && debouncedQuery.length >= 2) {
      return <EmptyState message={t('no-results') || 'Žiadne výsledky'} />;
    }

    return null;
  }, [
    isLoading,
    error,
    places,
    hasSearched,
    debouncedQuery,
    handlePlaceSelect,
    t,
  ]);

  const renderContent = useCallback(() => {
    if (query.length === 0) {
      return renderSearchHistory();
    }
    return renderSearchResults();
  }, [query, renderSearchHistory, renderSearchResults]);

  // Main render
  if (isMapShown) {
    return <MapSearch setIsMapShown={setIsMapShown} />;
  }

  return (
    <Layout pageTitle="Vyhľadať miesta" showTopBar={false}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitle}>
                  <Text style={styles.titleText}>Kam sa chcete vybrať?</Text>
                </View>
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={handleShowMap}
                >
                  <FontAwesomeIcon icon={Icons.Map} size={24} color="white" />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <SearchInput
                value={query}
                onChangeText={setQuery}
                onClear={handleClearSearch}
                placeholder={t('search-place') || 'Vyhľadajte miesto...'}
              />

              {/* Results */}
              <ScrollView
                style={styles.scrollView}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingBottom:
                      tabBarHeight + insets.bottom + (!isPremium ? 100 : 20),
                  },
                ]}
              >
                {renderContent()}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        {/* Banner Ad */}
        {!isPremium && (
          <View
            style={[
              styles.adContainer,
              {
                bottom: tabBarHeight - 8,
              },
            ]}
          >
            <InlineAd />
          </View>
        )}
      </View>
    </Layout>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    flex: 1,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  mapButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInputContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderRadius: 25,
    borderColor: primaryDeepColor,
    borderWidth: 3,
    backgroundColor: 'white',
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputField: {
    color: primaryDeepColor,
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: 'transparent',
    paddingRight: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  placeItem: {
    marginBottom: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  placeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  placeItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ scale: 0.98 }],
  },
  placeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  placeTextContainer: {
    flex: 1,
  },
  placeMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  placeSecondaryText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  textPressed: {
    color: primaryColor,
  },
  secondaryTextPressed: {
    color: primaryDeepColor,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 12,
  },
  adContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
});

export default PlaceSearch;
