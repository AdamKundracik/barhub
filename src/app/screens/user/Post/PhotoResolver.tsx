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
import { useThemeColors } from '../../../utils/styles/themeColors';
import { Icons } from '../../../utils/icons/icons';

const { width } = Dimensions.get('window');

// Components
const EmptyState: React.FC<{
  message?: string;
  type?: 'no-results' | 'error' | 'no-location';
  onRetry?: () => void;
}> = ({ message, type = 'no-results', onRetry }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-results':
        return {
          icon: <MapPinIcon size={48} color={colors.primaryColor} />,
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
            <FontAwesomeIcon icon={Icons.XCircle} size={48} color={colors.warningColor} />
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
            <FontAwesomeIcon icon={Icons.Location} size={48} color={colors.warningColor} />
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
          icon: <MapPinIcon size={48} color={colors.primaryColor} />,
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
      <View style={[styles.emptyStateIconContainer, { backgroundColor: colors.primaryTextColor + '0D', borderColor: colors.primaryTextColor + '1A' }]}>{content.icon}</View>
      <Text style={[styles.emptyStateTitle, { color: colors.primaryTextColor }]}>{content.title}</Text>
      {content.subtitle && (
        <Text style={[styles.emptyStateSubtitle, { color: colors.secondaryTextColor }]}>{content.subtitle}</Text>
      )}
      {content.suggestion && (
        <View style={[styles.emptyStateSuggestion, { backgroundColor: colors.primaryTextColor + '0D', borderColor: colors.primaryTextColor + '1A' }]}>
          <FontAwesomeIcon
            icon={Icons.Info}
            size={16}
            color={colors.secondaryTextColor}
          />
          <Text style={[styles.emptyStateSuggestionText, { color: colors.secondaryTextColor }]}>
            {content.suggestion}
          </Text>
        </View>
      )}
      {content.showRetry && onRetry && (
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            {
              borderColor: colors.primaryColor,
              shadowColor: colors.primaryColor,
              backgroundColor: pressed ? colors.primaryColor : 'transparent',
            },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={onRetry}
        >
          {({ pressed }) => (
            <Text
              style={[
                styles.retryButtonText,
                {
                  color: pressed ? colors.primaryBgColor : colors.primaryColor,
                },
              ]}
            >
              {t('retry') || 'Skúsiť znovu'}
            </Text>
          )}
        </Pressable>
      )}

      {/* Dekoratívne elementy */}
      <View style={styles.decorativeContainer}>
        <View style={[styles.decorativeCircle, styles.circle1, { borderColor: colors.primaryColor }]} />
        <View style={[styles.decorativeCircle, styles.circle2, { borderColor: colors.primaryColor }]} />
        <View style={[styles.decorativeCircle, styles.circle3, { borderColor: colors.primaryColor }]} />
      </View>
    </View>
  );
};

const LoadingIndicator: React.FC = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primaryColor} />
      <Text style={[styles.loadingText, { color: colors.secondaryTextColor }]}>
        {t('photo-resolver-loading') || 'Hľadám miesta v okolí...'}
      </Text>
    </View>
  );
};

const PlaceItem: React.FC<{
  place: Place;
  onPress: () => void;
}> = ({ place, onPress }) => {
  const colors = useThemeColors();
  return (
    <Pressable style={placeItemStyles.placeItem} onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            placeItemStyles.placeItemContent,
            {
              backgroundColor: pressed
                ? colors.primaryTextColor + '26'
                : colors.primaryTextColor + '0D',
            },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={[placeItemStyles.placeIconContainer, { backgroundColor: colors.primaryTextColor + '1A' }]}>
            <MapPinIcon size={20} color={colors.primaryColor} />
          </View>
          <View style={placeItemStyles.placeTextContainer}>
            <Text
              style={[
                placeItemStyles.placeMainText,
                {
                  color: pressed ? colors.primaryColor : colors.primaryTextColor,
                },
              ]}
            >
              {place?.displayName?.text || 'Neznáme miesto'}
            </Text>
            <Text
              style={[
                placeItemStyles.placeSecondaryText,
                {
                  color: pressed
                    ? colors.primaryColor + 'CC'
                    : colors.secondaryTextColor,
                },
              ]}
            >
              {place.formattedAddress || ''}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

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
    // backgroundColor is set inline to use theme colors
    borderRadius: 16,
  },
  placeItemPressed: {
    // backgroundColor and transform are set inline to use theme colors
  },
  placeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor is set inline to use theme colors
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
    // color is set inline to use theme colors
    marginBottom: 2,
  },
  placeSecondaryText: {
    fontSize: 14,
    // color is set inline to use theme colors
  },
  textPressed: {
    // color is set inline to use theme colors
  },
  secondaryTextPressed: {
    // color is set inline to use theme colors
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
    // color is set inline to use theme colors
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
    // backgroundColor and borderColor are set inline to use theme colors
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    // color is set inline to use theme colors
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    // color is set inline to use theme colors
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
    maxWidth: width * 0.8,
  },
  emptyStateSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor and borderColor are set inline to use theme colors
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginBottom: 24,
    maxWidth: width * 0.85,
  },
  emptyStateSuggestionText: {
    fontSize: 13,
    // color is set inline to use theme colors
    textAlign: 'center',
    flex: 1,
    lineHeight: 18,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    // borderColor, backgroundColor, and shadowColor are set inline to use theme colors
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retryButtonPressed: {
    // backgroundColor and transform are set inline to use theme colors
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // color is set inline to use theme colors
    letterSpacing: 0.5,
  },
  retryButtonTextPressed: {
    // color is set inline to use theme colors
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
    // borderColor is set inline to use theme colors
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
