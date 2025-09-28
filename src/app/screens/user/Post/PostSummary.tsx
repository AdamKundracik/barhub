import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  postBgColor,
  primaryBgColor,
  primaryColor,
  separatorColor,
} from '../../../utils/styles/colors';
import { Place } from '../../../utils/types/types';
import { useTranslation } from 'react-i18next';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { uploadImageAsync } from '../../../utils/helper-functions/imageUploadFunctions';
import { useQueryClient } from 'react-query';
import postService from '../../../utils/services/post.service';
import { geohashForLocation } from 'geofire-common';
import { ScreenLayout } from '@/src/app/components/shared/Layouts/ScreenLayout';
import { sendResponseNotificationToRecipients } from '../../../utils/services/notifications-service';
import { generateUID } from '../../../utils/helper-functions/generateUID';
import { Post } from '@/common/types/postTypes';
import { OccupancyEnum } from '@/src/app/utils/types/Feed/PostTypes';
import { Center } from '@/components/ui/center';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { useFiltersStore } from '@/src/app/utils/store/filtersStorage';
import FastImage from 'react-native-fast-image';
import { useUserData } from '@/src/app/utils/hooks/useUserData';
import { useCustomToast } from '@/src/app/components/shared/Toaster';
import { useUserStore } from '@/src/app/utils/store/userStore';

type SummaryProps = {
  image: string;
  place: Place;
  senderToken?: string;
  notificationId?: string;
};

const { height } = Dimensions.get('window');

export const PostSummary = ({ route }: any) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const routeParams = route.params as SummaryProps;
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { refetch } = useUserData();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  const { resetFilters } = useFiltersStore();
  const { setLastUploadedPost } = useUserStore();

  const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyEnum>(
    OccupancyEnum.FULL
  );
  const [tempOccupancy, setTempOccupancy] = useState<OccupancyEnum>(
    OccupancyEnum.FULL
  );
  const [showPicker, setShowPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const image = routeParams?.image;
  const place = routeParams?.place;
  const senderToken = routeParams?.senderToken;

  useEffect(() => {
    if (routeParams?.place) {
      const initial = OccupancyEnum.FULL;
      setSelectedOccupancy(initial);
      setTempOccupancy(initial);
    }
  }, [routeParams]);

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
    setTempOccupancy(selectedOccupancy);
    setShowPicker(true);
  }, [selectedOccupancy]);

  const closePicker = useCallback(() => {
    setShowPicker(false);
    setTempOccupancy(selectedOccupancy);
  }, [selectedOccupancy]);

  const confirmPickerSelection = useCallback(() => {
    setSelectedOccupancy(tempOccupancy);
    setShowPicker(false);
  }, [tempOccupancy]);

  const handleSavePost = useCallback(async () => {
    if (!image || !place || isSaving) return;

    setIsSaving(true);

    try {
      const fileId = generateUID();
      const url = await uploadImageAsync(image, place.id, fileId);

      if (!url) {
        throw new Error('Failed to upload image');
      }

      const hash = geohashForLocation([
        place.location.latitude ?? 0,
        place.location.longitude ?? 0,
      ]);

      const newPost: Omit<Post, 'creationTime'> = {
        geohash: hash,
        location: {
          _lat: place.location.latitude ?? 0,
          _long: place.location.longitude ?? 0,
        },
        placeTypes: place.types,
        id: '',
        userId: '',
        fileId: fileId,
        occupancy: selectedOccupancy,
        folderId: place.id,
        timestamp: Date.now(),
        placeName: place.displayName.text ?? '',
        placeAddress: place.formattedAddress ?? '',
        photoUrl: url,
      };

      const addedPostResponse = await postService.savePost(newPost);
      await queryClient.invalidateQueries({ queryKey: ['posts'] });

      if (senderToken) {
        await sendResponseNotificationToRecipients(
          place.id,
          senderToken,
          addedPostResponse.id
        );
      }

      setLastUploadedPost(new Date());
      resetFilters();
      await refetch();

      showSuccessToast(t('success'), t('post-success-info'));
      navigation.navigate('Feed');
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
      <ScreenLayout onBackPress={navigation.goBack} showBackButton>
        <Center style={{ flex: 1 }}>
          <Text style={styles.errorText}>{t('invalid-data')}</Text>
        </Center>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout onBackPress={navigation.goBack} showBackButton>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>{t('new-post')}</Text>

        {/* Photo with 3:4 aspect ratio */}
        <View style={styles.photoContainer}>
          <FastImage
            style={styles.photo}
            source={{
              uri: image,
              priority: FastImage.priority.high,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          {/* Location - wider display */}
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationTitle}>{t('location')}</Text>
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.placeName} numberOfLines={2}>
                {place.displayName.text}
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
                { borderColor: occupancyColors[selectedOccupancy] },
              ]}
            >
              <View
                style={[
                  styles.occupancyDot,
                  { backgroundColor: occupancyColors[selectedOccupancy] },
                ]}
              />
              <Text style={styles.occupancyText}>
                {occupancyLabels[selectedOccupancy]}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <Center style={styles.buttonContainer}>
          <Button
            variant="solid"
            size="lg"
            action="primary"
            style={styles.saveButton}
            onPress={handleSavePost}
            isDisabled={isSaving}
          >
            {isSaving ? (
              <ButtonSpinner />
            ) : (
              <ButtonText style={styles.saveButtonText}>{t('save')}</ButtonText>
            )}
          </Button>
        </Center>
      </ScrollView>

      {/* Enhanced Occupancy Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <TouchableWithoutFeedback onPress={closePicker}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={closePicker}
              style={styles.modalHeaderButton}
            >
              <Text style={styles.modalCancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('select-occupancy')}</Text>
            <TouchableOpacity
              onPress={confirmPickerSelection}
              style={styles.modalHeaderButton}
            >
              <Text style={styles.modalDoneText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>

          {/* Options - Much wider */}
          <ScrollView style={styles.optionsScrollView}>
            <View style={styles.optionsContainer}>
              {Object.values(OccupancyEnum).map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.option,
                    tempOccupancy === option && styles.optionSelected,
                  ]}
                  onPress={() => setTempOccupancy(option)}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.optionDot,
                        { backgroundColor: occupancyColors[option] },
                      ]}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        tempOccupancy === option && styles.optionTextSelected,
                      ]}
                    >
                      {occupancyLabels[option]}
                    </Text>
                  </View>
                  {tempOccupancy === option && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  title: {
    color: primaryColor,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },

  // Photo section with 3:4 aspect ratio
  photoContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
    backgroundColor: '#333',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
  },

  // Details card
  detailsCard: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
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
  },
  locationTitle: {
    color: primaryColor,
    fontSize: 18,
    fontWeight: '600',
  },
  locationContent: {
    paddingLeft: 30,
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

  // Occupancy section
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
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginLeft: 30,
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
  dropdownArrow: {
    color: separatorColor,
    fontSize: 14,
    marginLeft: 10,
  },

  // Save button
  buttonContainer: {
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: primaryColor,
    borderRadius: 16,
    width: '100%',
    elevation: 4,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Modal - Much wider and better
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: height * 0.65,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  modalCancelText: {
    color: separatorColor,
    fontSize: 17,
  },
  modalDoneText: {
    color: primaryColor,
    fontSize: 17,
    fontWeight: '600',
  },

  // Options - Much wider and better spacing
  optionsScrollView: {
    flex: 1,
  },
  optionsContainer: {
    padding: 25,
    paddingTop: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 12,
    backgroundColor: '#252525',
  },
  optionSelected: {
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: primaryColor,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 15,
  },
  optionText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: primaryColor,
    fontWeight: '600',
  },
  checkmark: {
    color: primaryColor,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },

  // Error state
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PostSummary;
