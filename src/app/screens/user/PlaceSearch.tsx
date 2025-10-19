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
import { useUserFavorites } from '@/src/app/hooks/useUserFavorites';

// Constants
const MAX_FAVORITE_PLACES = 10;

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
const EmptyState: React.FC<{ message: string; type?: 'no-results' | 'error' | 'no-history' | 'no-favorites' }> = ({ 
  message, 
  type = 'no-results' 
}) => {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-results':
        return {
          icon: <FontAwesomeIcon icon={Icons.Search} size={48} color={primaryColor} />,
          title: 'Žiadne výsledky',
          subtitle: 'Skúste zadať iný názov miesta',
          suggestion: 'Môžete tiež použiť mapu na výber miesta'
        };
      case 'error':
        return {
          icon: <FontAwesomeIcon icon={Icons.XCircle} size={48} color="#FF6B6B" />,
          title: 'Chyba pri vyhľadávaní',
          subtitle: 'Skúste to znova neskôr',
          suggestion: 'Skontrolujte internetové pripojenie'
        };
      case 'no-history':
        return {
          icon: <FontAwesomeIcon icon={Icons.Clock} size={48} color={primaryColor} />,
          title: 'Žiadna história vyhľadávania',
          subtitle: 'Vaše vyhľadané miesta sa tu zobrazia',
          suggestion: 'Začnite vyhľadávať miesta'
        };
      case 'no-favorites':
        return {
          icon: <FontAwesomeIcon icon={Icons.Heart} size={48} color="#FF6B6B" />,
          title: 'Žiadne obľúbené miesta',
          subtitle: 'Pridajte si miesta do obľúbených',
          suggestion: 'Kliknite na srdiečko pri mieste'
        };
      default:
        return {
          icon: <MapPinIcon size={48} color={primaryColor} />,
          title: message,
          subtitle: '',
          suggestion: ''
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        {content.icon}
      </View>
      <Text style={styles.emptyStateTitle}>{content.title}</Text>
      {content.subtitle && (
        <Text style={styles.emptyStateSubtitle}>{content.subtitle}</Text>
      )}
      {content.suggestion && (
        <View style={styles.emptyStateSuggestion}>
          <FontAwesomeIcon icon={Icons.Info} size={16} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.emptyStateSuggestionText}>{content.suggestion}</Text>
        </View>
      )}
    </View>
  );
};

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
  <Pressable style={placeItemStyle.placeItem} onPress={onPress}>
    {({ pressed }) => (
      <View
        style={[
          placeItemStyle.placeItemContent,
          pressed && placeItemStyle.placeItemPressed,
        ]}
      >
        <View style={placeItemStyle.placeIconContainer}>
          {isHistory ? (
            <ClockIcon size={20} color={primaryColor} />
          ) : (
            <MapPinIcon size={20} color={primaryColor} />
          )}
        </View>
        <View style={placeItemStyle.placeTextContainer}>
          <Text
            style={[
              placeItemStyle.placeMainText,
              pressed && placeItemStyle.textPressed,
            ]}
          >
            {mainText}
          </Text>
          <Text
            style={[
              placeItemStyle.placeSecondaryText,
              pressed && placeItemStyle.secondaryTextPressed,
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

  const { setPlaceId, setPlaceName, setPlaceAddress } = usePlaceStore();
  const { addSearchHistoryItemAsync, userData, isPremium, userId } =
    useUserData();
  const { favorites } = useUserFavorites(userId);

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
      setPlaceAddress(secondaryText);

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
  const renderFavoritePlaces = useCallback(() => {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.favoritesHeader}>
          <FontAwesomeIcon icon={Icons.HeartSolid} size={18} color="#FF6B6B" />
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
            Obľúbené miesta
          </Text>
          {favorites && favorites.length > 0 && (
            <Text style={styles.favoritesCount}>
              {favorites.length}/{MAX_FAVORITE_PLACES}
            </Text>
          )}
        </View>
        {!favorites || favorites.length === 0 ? (
          <EmptyState 
            message="Žiadne obľúbené miesta" 
            type="no-favorites" 
          />
        ) : (
          favorites.slice(0, MAX_FAVORITE_PLACES).map((favorite, index) => (
            <PlaceItem
              key={`favorite-${index}`}
              mainText={favorite.placeName}
              secondaryText={favorite.placeAddress}
              onPress={() =>
                handlePlaceSelect(
                  {
                    placeId: favorite.placeId,
                    mainText: favorite.placeName,
                    secondaryText: favorite.placeAddress,
                  },
                  true
                )
              }
            />
          ))
        )}
      </View>
    );
  }, [favorites, handlePlaceSelect]);

  const renderSearchHistory = useCallback(() => {
    if (searchHistory.length === 0) {
      return (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Nedávno vyhľadané</Text>
          <EmptyState 
            message={t('no-search-history') || 'Žiadna história vyhľadávania'} 
            type="no-history" 
          />
        </View>
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
      return <EmptyState message="Nastala chyba pri vyhľadávaní" type="error" />;
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
      return <EmptyState message={t('no-results') || 'Žiadne výsledky'} type="no-results" />;
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
      // Show favorites first, then search history
      return (
        <>
          {renderFavoritePlaces()}
          {renderSearchHistory()}
        </>
      );
    }
    return renderSearchResults();
  }, [query, renderFavoritePlaces, renderSearchHistory, renderSearchResults]);

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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
            <View style={styles.scrollView}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                bounces={true}
                alwaysBounceVertical={false}
                nestedScrollEnabled={true}
                removeClippedSubviews={false}
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
          </View>
        </KeyboardAvoidingView>
      </View>

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
    </Layout>
  );
};

// PlaceItem Styles
const placeItemStyle = StyleSheet.create({
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
    color: primaryColor,
    opacity: 0.8,
  },
});

// Main Screen Styles
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
    flexGrow: 1,
  },
  sectionContainer: {
    marginBottom: 24,
    flexShrink: 0,
  },
  favoritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  favoritesCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  emptyHistoryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    minHeight: 200,
    flexShrink: 0,
  },
  emptyStateIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  emptyStateSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  emptyStateSuggestionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    flex: 1,
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
