import React, { useEffect, useState } from 'react';
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

import Layout from '@/src/app/components/shared/Layouts/Layout';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { fetchNearbyPlaces } from '../../../utils/helper-functions/fetchPlacesAPI';
import { useLocationStore } from '@/src/app/utils/store/locationStore';
import { radius } from '@/src/app/utils/constants/constants';
import { Place } from '../../../utils/types/types';
import { UserStackList } from '../../../utils/types/screen-types';
import { primaryColor, primaryDeepColor } from '../../../utils/styles/colors';

const { width } = Dimensions.get('window');

export const PhotoResolver = ({ route }: any) => {
  const { location } = useLocationStore();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<UserStackList>>();

  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [image, setImage] = useState<string | null>(null);

  const routeParams = route.params as { image?: string };

  useEffect(() => {
    if (routeParams?.image) {
      setImage(routeParams.image);
    }
  }, [routeParams?.image]);

  useEffect(() => {
    const getPlaces = async () => {
      if (!location) {
        setLoading(false);
        console.error('Location could not be retrieved');
        return;
      }

      try {
        const data = await fetchNearbyPlaces(location, radius);
        setPlaces(data.places || []);
      } catch (error) {
        console.error('Failed to fetch places:', error);
      } finally {
        setLoading(false);
      }
    };

    getPlaces();
  }, [location]);

  const renderItem = ({ item }: { item: Place; index: number }) => (
    <Pressable
      key={item.id}
      style={{ paddingVertical: 10 }}
      onPress={() => {
        navigation.navigate('PostSummary', { image: image ?? '', place: item });
      }}
    >
      {({ pressed }) => (
        <View>
          <Text
            style={[
              { fontSize: 16, fontWeight: 'bold' },
              pressed ? { color: primaryColor } : { color: 'white' },
            ]}
          >
            {item?.displayName.text}
          </Text>
          <Text
            style={[
              { fontSize: 14 },
              pressed ? { color: primaryDeepColor } : { color: 'grey' },
            ]}
          >
            {item.formattedAddress}
          </Text>
        </View>
      )}
    </Pressable>
  );

  const handleRetry = async () => {
    setLoading(true);
    if (!location) {
      setLoading(false);
      console.error('Location could not be retrieved');
      return;
    }

    try {
      const data = await fetchNearbyPlaces(location, radius);
      setPlaces(data.places || []);
    } catch (error) {
      console.error('Failed to fetch places:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout pageTitle={'izi'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={32} />
        </View>
      </Layout>
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {/* Hlavná ikona */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>📍</Text>
              </View>
              <View style={styles.iconPulse} />
            </View>

            {/* Textový obsah */}
            <View style={styles.textContainer}>
              <Text style={styles.emptyTitle}>{t('no-available-places')}</Text>
              <Text style={styles.emptyDescription}>
                Skúste rozšíriť oblasť vyhľadávania alebo sa presunúť na iné
                miesto
              </Text>
            </View>

            {/* Akčné tlačidlo */}
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
              onPress={handleRetry}
            >
              {({ pressed }) => (
                <Text
                  style={[
                    styles.retryButtonText,
                    pressed && styles.retryButtonTextPressed,
                  ]}
                >
                  🔄 Skúsiť znovu
                </Text>
              )}
            </Pressable>

            {/* Dekoratívne elementy */}
            <View style={styles.decorativeContainer}>
              <View style={[styles.decorativeCircle, styles.circle1]} />
              <View style={[styles.decorativeCircle, styles.circle2]} />
              <View style={[styles.decorativeCircle, styles.circle3]} />
            </View>
          </View>
        }
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    minHeight: 400,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: primaryDeepColor,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: primaryColor,
    shadowColor: primaryColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  iconEmoji: {
    fontSize: 32,
  },
  iconPulse: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: primaryColor,
    opacity: 0.1,
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
    maxWidth: width * 0.8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#7C7C7C',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.7,
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
    opacity: 0.1,
  },
  circle1: {
    width: 100,
    height: 100,
    top: 50,
    left: -30,
  },
  circle2: {
    width: 60,
    height: 60,
    bottom: 100,
    right: -20,
  },
  circle3: {
    width: 40,
    height: 40,
    top: 200,
    right: 50,
  },
});

export default PhotoResolver;
