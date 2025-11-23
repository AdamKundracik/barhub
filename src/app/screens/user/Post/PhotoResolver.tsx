import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { MapPinIcon } from 'lucide-react-native';

import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { fetchNearbyPlaces } from '../../../utils/helper-functions/fetchPlacesAPI';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { radius } from '@/src/app/utils/constants/constants';
import { Place } from '../../../utils/types/types';
import { UserStackList } from '../../../utils/types/screen-types';
import { primaryColor } from '../../../utils/styles/colors';
import { Icons } from '../../../utils/icons/icons';

const { width } = Dimensions.get('window');

// Components
const EmptyState: React.FC<{
  message?: string;
  type?: 'no-results' | 'error' | 'no-location';
  onRetry?: () => void;
}> = ({ message, type = 'no-results', onRetry }) => {
  const { t } = useTranslation();

  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-results':
        return {
          icon: <MapPinIcon size={48} color={primaryColor} />,
          title: t('no-available-places') || 'Žiadne miesta v okolí',
          subtitle:
            t('photo-resolver-no-places-subtitle') ||
            'Skúste sa presunúť na iné miesto',
          suggestion:
            t('photo-resolver-no-places-suggestion') ||
            'Presuňte sa bližšie k podnikom a skúste znova',
          showRetry: true,
        };
      case 'error':
        return {
          icon: (
            <FontAwesomeIcon icon={Icons.XCircle} size={48} color="#FF6B6B" />
          ),
          title: t('photo-resolver-error-title') || 'Chyba pri načítaní miest',
          subtitle:
            t('photo-resolver-error-subtitle') ||
            'Nepodarilo sa načítať miesta v okolí',
          suggestion:
            t('photo-resolver-error-suggestion') ||
            'Skontrolujte internetové pripojenie a skúste znova',
          showRetry: true,
        };
      case 'no-location':
        return {
          icon: (
            <FontAwesomeIcon icon={Icons.Location} size={48} color="#FFA500" />
          ),
          title: t('photo-resolver-no-location-title') || 'Poloha nedostupná',
          subtitle:
            t('photo-resolver-no-location-subtitle') ||
            'Nepodarilo sa získať vašu polohu',
          suggestion:
            t('photo-resolver-no-location-suggestion') ||
            'Skontrolujte, či máte povolené služby polohy',
          showRetry: true,
        };
      default:
        return {
          icon: <MapPinIcon size={48} color={primaryColor} />,
          title: message || 'Žiadne miesta',
          subtitle: '',
          suggestion: '',
          showRetry: false,
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>{content.icon}</View>
      <Text style={styles.emptyStateTitle}>{content.title}</Text>
      {content.subtitle && (
        <Text style={styles.emptyStateSubtitle}>{content.subtitle}</Text>
      )}
      {content.suggestion && (
        <View style={styles.emptyStateSuggestion}>
          <FontAwesomeIcon
            icon={Icons.Info}
            size={16}
            color="rgba(255, 255, 255, 0.6)"
          />
          <Text style={styles.emptyStateSuggestionText}>
            {content.suggestion}
          </Text>
        </View>
      )}
      {content.showRetry && onRetry && (
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
          ]}
          onPress={onRetry}
        >
          {({ pressed }) => (
            <Text
              style={[
                styles.retryButtonText,
                pressed && styles.retryButtonTextPressed,
              ]}
            >
              {t('retry') || 'Skúsiť znovu'}
            </Text>
          )}
        </Pressable>
      )}

      {/* Dekoratívne elementy */}
      <View style={styles.decorativeContainer}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
      </View>
    </View>
  );
};

const LoadingIndicator: React.FC = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={primaryColor} />
      <Text style={styles.loadingText}>
        {t('photo-resolver-loading') || 'Hľadám miesta v okolí...'}
      </Text>
    </View>
  );
};

const PlaceItem: React.FC<{
  place: Place;
  onPress: () => void;
}> = ({ place, onPress }) => (
  <Pressable style={placeItemStyles.placeItem} onPress={onPress}>
    {({ pressed }) => (
      <View
        style={[
          placeItemStyles.placeItemContent,
          pressed && placeItemStyles.placeItemPressed,
        ]}
      >
        <View style={placeItemStyles.placeIconContainer}>
          <MapPinIcon size={20} color={primaryColor} />
        </View>
        <View style={placeItemStyles.placeTextContainer}>
          <Text
            style={[
              placeItemStyles.placeMainText,
              pressed && placeItemStyles.textPressed,
            ]}
          >
            {place?.displayName?.text || 'Neznáme miesto'}
          </Text>
          <Text
            style={[
              placeItemStyles.placeSecondaryText,
              pressed && placeItemStyles.secondaryTextPressed,
            ]}
          >
            {place.formattedAddress || ''}
          </Text>
        </View>
      </View>
    )}
  </Pressable>
);

// Main Component
export const PhotoResolver = ({ route }: any) => {
  const { location } = useLocationStore();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const routeParams = route.params as { image?: string };

  useEffect(() => {
    if (routeParams?.image) {
      setImage(routeParams.image);
    }
  }, [routeParams?.image]);

  const fetchPlaces = useCallback(async () => {
    if (!location) {
      setError('no-location');
      setLoading(false);
      console.error('Location could not be retrieved');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchNearbyPlaces(location, radius);
      setPlaces(data.places || []);
      if (!data.places || data.places.length === 0) {
        setError('no-results');
      }
    } catch (error) {
      console.error('Failed to fetch places:', error);
      setError('error');
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handleRetry = useCallback(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handlePlaceSelect = useCallback(
    (place: Place) => {
      navigation.navigate('PostSummary', { image: image ?? '', place });
    },
    [navigation, image]
  );

  const renderItem = useCallback(
    ({ item }: { item: Place }) => (
      <PlaceItem place={item} onPress={() => handlePlaceSelect(item)} />
    ),
    [handlePlaceSelect]
  );

  const renderListEmpty = useCallback(() => {
    if (loading) {
      return null;
    }

    if (error) {
      return (
        <EmptyState
          type={error as 'no-results' | 'error' | 'no-location'}
          onRetry={handleRetry}
        />
      );
    }

    return <EmptyState type="no-results" onRetry={handleRetry} />;
  }, [loading, error, handleRetry]);

  if (loading && places.length === 0) {
    return (
      <ScreenLayout
        title={t('select-place')}
        showTitle
        onBackPress={navigation.goBack}
        showBackButton
      >
        <LoadingIndicator />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={t('select-place')}
      showTitle
      onBackPress={navigation.goBack}
      showBackButton
    >
      <FlashList
        data={places}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={styles.listContent}
      />
    </ScreenLayout>
  );
};

// PlaceItem Styles
const placeItemStyles = StyleSheet.create({
  placeItem: {
    marginBottom: 8,
    marginHorizontal: 16,
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
  listContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    minHeight: 400,
  },
  emptyStateIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
    maxWidth: width * 0.8,
  },
  emptyStateSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
    marginBottom: 24,
    maxWidth: width * 0.85,
  },
  emptyStateSuggestionText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    flex: 1,
    lineHeight: 18,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: primaryColor,
    backgroundColor: 'transparent',
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: primaryColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retryButtonPressed: {
    backgroundColor: primaryColor,
    transform: [{ scale: 0.98 }],
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: primaryColor,
    letterSpacing: 0.5,
  },
  retryButtonTextPressed: {
    color: '#020213',
  },
  decorativeContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: primaryColor,
    opacity: 0.08,
  },
  circle1: {
    width: 120,
    height: 120,
    top: 30,
    left: -40,
  },
  circle2: {
    width: 80,
    height: 80,
    bottom: 80,
    right: -30,
  },
  circle3: {
    width: 50,
    height: 50,
    top: 180,
    right: 40,
  },
});

export default PhotoResolver;
