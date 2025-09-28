import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Device from 'react-native-device-info';
import {
  postBgColor,
  primaryBgColor,
  primaryColor,
  separatorColor,
} from '../../../utils/styles/colors';
import { Place } from '../../../utils/types/types';
import { useTranslation } from 'react-i18next';
import { formStyles } from '../../../utils/styles/styles';
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
import { Picker } from '@react-native-picker/picker';
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

const isTablet = Device.isTablet();
const width = Dimensions.get('window').width;

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

  const [image, setImage] = useState<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [senderToken, setSenderToken] = useState<string | null>(null);

  useEffect(() => {
    if (routeParams?.image && routeParams?.place) {
      setImage(routeParams.image);
      setPlace(routeParams.place);
      setSenderToken(routeParams.senderToken ?? null);
      // initialize both selected and temp
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

  const openPicker = () => {
    setTempOccupancy(selectedOccupancy); // start with current selection
    setShowPicker(true);
  };

  const onPickerCancel = () => {
    setShowPicker(false);
    setTempOccupancy(selectedOccupancy); // revert temp
  };

  const onPickerDone = () => {
    setSelectedOccupancy(tempOccupancy);
    setShowPicker(false);
  };

  const handleSavePost = async () => {
    setIsSaving(true);
    const fileId = generateUID();

    if (image && place) {
      try {
        const url = await uploadImageAsync(image, place?.id, fileId);

        if (url) {
          const hash = geohashForLocation([
            place?.location.latitude ?? 0,
            place?.location.longitude ?? 0,
          ]);

          const newPost: Omit<Post, 'creationTime'> = {
            geohash: hash,
            location: {
              _lat: place?.location.latitude ?? 0,
              _long: place?.location.longitude ?? 0,
            },
            placeTypes: place.types,
            id: '',
            userId: '',
            fileId: fileId,
            occupancy: selectedOccupancy ?? '',
            folderId: place?.id ?? '',
            timestamp: Date.now(),
            placeName: place?.displayName.text ?? '',
            placeAddress: place?.formattedAddress ?? '',
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
        }
      } catch (e) {
        console.error(e);
        showErrorToast('someting-went-wrong');
        Alert.alert('Failed to save post');
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsSaving(false);
    }
  };

  return (
    <ScreenLayout onBackPress={navigation.goBack} showBackButton>
      <TouchableWithoutFeedback>
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Text
            style={{
              color: primaryColor,
              fontSize: 32,
              textAlign: 'center',
              marginBottom: 15,
            }}
          >
            {t('new-post')}
          </Text>

          <View
            style={
              isTablet ? tabletStyles.contentContainer : styles.contentContainer
            }
          >
            <View style={styles.textContainer}>
              <Text style={styles.label}>{t('location')}:</Text>
              <Text
                style={styles.dynamicText}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {place?.formattedAddress ?? ''}
              </Text>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.label}>{t('name')}</Text>
              <Text style={styles.dynamicText}>
                {place?.displayName.text ?? ''}
              </Text>
            </View>

            {/* Occupancy input-like + Modal picker */}
            <View style={[styles.textContainer]}>
              <Text style={styles.label}>{t('occupancy')}:</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <TouchableOpacity onPress={openPicker} style={styles.inputLike}>
                  <Text style={styles.inputLikeText}>
                    {occupancyLabels[selectedOccupancy]}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: width, marginTop: 15 }}>
              <FastImage
                style={isTablet ? tabletStyles.photo : styles.photo}
                source={{
                  uri: image ?? '',
                  priority: FastImage.priority.high,
                }}
                resizeMode={FastImage.resizeMode.cover}
              />
            </View>

            <Center>
              <Button
                variant="solid"
                size="md"
                action="primary"
                style={formStyles.buttonPrimary}
                onPress={handleSavePost}
                isDisabled={isSaving}
              >
                {!isSaving ? (
                  <ButtonText style={formStyles.buttonText}>
                    {t('save')}
                  </ButtonText>
                ) : (
                  <ButtonSpinner />
                )}
              </Button>
            </Center>
          </View>

          {/* Picker Modal */}
          <Modal
            visible={showPicker}
            transparent
            animationType="slide"
            onRequestClose={onPickerCancel}
          >
            <TouchableWithoutFeedback onPress={onPickerCancel}>
              <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>

            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onPickerCancel}>
                  <Text style={styles.modalHeaderText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onPickerDone}>
                  <Text style={[styles.modalHeaderText, { fontWeight: '700' }]}>
                    {t('submit')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={tempOccupancy}
                  onValueChange={(itemValue: OccupancyEnum) =>
                    setTempOccupancy(itemValue)
                  }
                  mode={Platform.OS === 'ios' ? 'dialog' : 'dropdown'}
                >
                  {Object.values(OccupancyEnum).map(option => (
                    <Picker.Item
                      key={option}
                      label={occupancyLabels[option]}
                      value={option}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  label: {
    color: separatorColor,
    width: '30%',
  },
  dynamicText: {
    color: 'white',
    flex: 1,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
  contentContainer: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
  },
  photo: {
    borderRadius: 20,
    width: '100%',
    aspectRatio: 1,
    zIndex: 1,
  },
  inputLike: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: primaryBgColor,
    minWidth: 150,
  },
  inputLikeText: {
    color: 'white',
    textAlign: 'right',
  },

  /* Modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContainer: {
    backgroundColor: '#111', // dark modal background
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#0b0b0b',
  },
  modalHeaderText: {
    color: 'white',
    fontSize: 16,
  },
  pickerWrap: {
    backgroundColor: '#0b0b0b',
  },
});

const tabletStyles = StyleSheet.create({
  contentContainer: {
    backgroundColor: postBgColor,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 30,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    zIndex: 1,
  },
});

export default PostSummary;
