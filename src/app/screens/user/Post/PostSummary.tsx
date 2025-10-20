import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  primaryBgColor,
  primaryColor,
  separatorColor,
} from '../../../utils/styles/colors';
import { Place } from '../../../utils/types/types';
import { useTranslation } from 'react-i18next';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { uploadService } from '../../../services/uploadService';
import { useQueryClient } from 'react-query';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { generateUID } from '../../../utils/helper-functions/generateUID';
import { OccupancyEnum } from '@/src/app/utils/types/Feed/PostTypes';
import { Center } from '@/components/ui/center';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { useFiltersStore } from '@/src/app/utils/store/filtersStorage';
import FastImage from 'react-native-fast-image';
import { useUserData } from '@/src/app/hooks/useUserQuery';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { useUserStore } from '@/src/app/utils/store/userStore';
import { buttonStyles } from '../../../utils/styles/buttonStyles';
import { usePostsStore } from '@/src/app/utils/store/postStore';
import { modalsStore } from '@/src/app/utils/store/modalsStore';

type SummaryProps = {
  image: string;
  place: Place;
  senderToken?: string;
  notificationId?: string;
};

export const PostSummary = ({ route }: any) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const routeParams = route.params as SummaryProps;
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { refetch, userId } = useUserData();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { resetFilters } = useFiltersStore();
  const { updateUserData } = useUserStore();
  const { scrollOnTop } = usePostsStore();
  const { openOccupancy } = modalsStore();

  const [selectedOccupancy, setSelectedOccupancy] =
    useState<OccupancyEnum | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const saveButtonRef = useRef<View>(null);

  const image = routeParams?.image;
  const place = routeParams?.place;
  const senderToken = routeParams?.senderToken;

  useEffect(() => {
    if (routeParams?.place) {
      setSelectedOccupancy(null);
    }
  }, [routeParams]);

  // Set gestureEnabled based on saving state
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !isSaving,
    });
  }, [navigation, isSaving]);

  // Block navigation when saving (including swipe gestures)
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', e => {
        if (!isSaving) {
          // If not saving, allow navigation
          return;
        }

        // Prevent default behavior of leaving the screen
        e.preventDefault();
      });

      return unsubscribe;
    }, [navigation, isSaving])
  );

  // Custom back press handler that blocks navigation during saving
  const handleBackPress = useCallback(() => {
    if (isSaving) {
      // Just block navigation without showing alert
      return;
    }
    navigation.goBack();
  }, [isSaving, navigation]);

  const occupancyLabels: Record<OccupancyEnum, string> = {
    [OccupancyEnum.FULL]: t('full'),
    [OccupancyEnum.ALMOST_FULL]: t('almost-full'),
    [OccupancyEnum.SPARSELY_OCCUPIED]: t('sparsely-occupied'),
    [OccupancyEnum.EMPTY]: t('empty'),
  };

  const occupancyColors: Record<OccupancyEnum, string> = {
    [OccupancyEnum.FULL]: '#FF4444',
    [OccupancyEnum.ALMOST_FULL]: '#FF8800',
    [OccupancyEnum.SPARSELY_OCCUPIED]: '#FFBB00',
    [OccupancyEnum.EMPTY]: '#44AA44',
  };

  const openPicker = useCallback(() => {
    openOccupancy(selectedOccupancy, (value: OccupancyEnum) => {
      setSelectedOccupancy(value);

      // Scroll to save button after selection
      setTimeout(() => {
        saveButtonRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
          },
          () => {
            // Fallback: scroll to end if measure fails
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        );
      }, 300);
    });
  }, [selectedOccupancy, openOccupancy]);

  const handleSavePost = useCallback(async () => {
    if (!image || !place || isSaving || !selectedOccupancy) return;

    setIsSaving(true);

    try {
      // Check if userId exists
      if (!userId) {
        throw new Error('User ID not found');
      }

      const fileId = generateUID();

      // Upload image and save post in one call
      // Backend handles both Cloudflare upload and DB save
      await uploadService.uploadPostImage(image, {
        userId: parseInt(userId),
        placeId: place.id,
        fileId: fileId,
        location: {
          _lat: place.location.latitude ?? 0,
          _long: place.location.longitude ?? 0,
        },
        placeTypes: place.types,
        occupancy: selectedOccupancy,
        placeName: place.displayName.text ?? '',
        placeAddress: place.formattedAddress ?? '',
        senderToken: senderToken, // Backend sends notification if senderToken exists
      });

      // Invalidate queries to refresh feed
      await queryClient.invalidateQueries({ queryKey: ['posts'] });

      updateUserData({ lastUploadedPostAt: new Date().toISOString() });
      resetFilters();
      await refetch();

      showSuccessToast(
        t('uploadPost.successTitle'),
        t('uploadPost.successDescription')
      );

      // Navigate to Feed
      navigation.navigate('Feed');

      // Scroll to top to show new post (with small delay for navigation)
      setTimeout(() => {
        scrollOnTop();
      }, 100);
    } catch (error) {
      console.error('Error saving post:', error);
      showErrorToast(t('something-went-wrong'));
      Alert.alert(t('error'), t('upload-failed'));
    } finally {
      setIsSaving(false);
    }
  }, [image, place, selectedOccupancy, senderToken, isSaving]);

  if (!image || !place) {
    return (
      <ScreenLayout onBackPress={handleBackPress} showBackButton>
        <Center style={{ flex: 1 }}>
          <Text style={styles.errorText}>{t('invalid-data')}</Text>
        </Center>
      </ScreenLayout>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenLayout onBackPress={handleBackPress} showBackButton>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Post Image at top - like PostDetail */}
          <FastImage
            style={styles.postImage}
            source={{
              uri: image,
              priority: FastImage.priority.high,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />

          {/* Content Container */}
          <View style={styles.contentContainer}>
            {/* Title */}
            <Text style={styles.title}>{t('new-post')}</Text>

            {/* Location Section */}
            <View style={styles.locationSection}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationTitle}>{t('location')}</Text>
              </View>
              <View>
                <Text style={styles.placeName} numberOfLines={2}>
                  {place.displayName?.text}
                </Text>
                <Text style={styles.placeAddress} numberOfLines={3}>
                  {place.formattedAddress}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Occupancy Selection */}
            <View style={styles.occupancySection}>
              <View style={styles.occupancyHeader}>
                <Text style={styles.occupancyIcon}>👥</Text>
                <Text style={styles.occupancyTitle}>{t('occupancy')}</Text>
              </View>

              <TouchableOpacity
                onPress={openPicker}
                style={[
                  styles.occupancyButton,
                  selectedOccupancy && {
                    borderColor: occupancyColors[selectedOccupancy],
                  },
                ]}
              >
                {selectedOccupancy && (
                  <View
                    style={[
                      styles.occupancyDot,
                      { backgroundColor: occupancyColors[selectedOccupancy] },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.occupancyText,
                    !selectedOccupancy && styles.occupancyPlaceholderText,
                  ]}
                >
                  {selectedOccupancy
                    ? occupancyLabels[selectedOccupancy]
                    : t('select-occupancy')}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <View
              ref={saveButtonRef}
              collapsable={false}
              style={styles.buttonContainer}
            >
              <Button
                variant="solid"
                size="lg"
                style={[
                  buttonStyles.primary,
                  !selectedOccupancy && buttonStyles.primaryDisabled,
                ]}
                onPress={handleSavePost}
                isDisabled={isSaving || !selectedOccupancy}
              >
                {isSaving ? (
                  <ButtonSpinner color="#000" />
                ) : (
                  <ButtonText style={buttonStyles.primaryText}>
                    {t('save')}
                  </ButtonText>
                )}
              </Button>
            </View>
          </View>
        </ScrollView>
      </ScreenLayout>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  scrollView: {
    flex: 1,
  },

  // Post Image at top - like PostDetail
  postImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },

  // Content Container
  contentContainer: {
    backgroundColor: primaryBgColor,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Title
  title: {
    color: primaryColor,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },

  // Location section - much more detailed
  locationSection: {
    marginBottom: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 10,
    width: 30,
  },
  locationTitle: {
    color: primaryColor,
    fontSize: 18,
    fontWeight: '600',
  },
  placeName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 24,
  },
  placeAddress: {
    color: separatorColor,
    fontSize: 15,
    lineHeight: 22,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },

  // Occupancy section - properly aligned
  occupancySection: {
    marginBottom: 5,
  },
  occupancyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  occupancyIcon: {
    fontSize: 20,
    marginRight: 10,
    width: 30,
  },
  occupancyTitle: {
    color: primaryColor,
    fontSize: 18,
    fontWeight: '600',
  },
  occupancyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: primaryBgColor,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333', // Default border color when nothing selected
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  occupancyDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  occupancyText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  occupancyPlaceholderText: {
    color: separatorColor,
    fontWeight: '400',
  },
  dropdownArrow: {
    color: separatorColor,
    fontSize: 14,
    marginLeft: 10,
  },

  // Save button
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },

  // Error state
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PostSummary;
