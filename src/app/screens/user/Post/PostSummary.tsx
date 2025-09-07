import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Device from 'react-native-device-info';
import {
  iconInactiveColor,
  postBgColor,
  primaryBgColor,
  primaryColor,
} from '../../../utils/styles/colors';
import { Image } from 'expo-image';
import { OccupancyEnum, Place } from '../../../utils/types/types';
import { useTranslation } from 'react-i18next';
import { formStyles } from '../../../utils/styles/styles';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { uploadImageAsync } from '../../../utils/helper-functions/imageUploadFunctions';
import { setUser } from '../../../utils/services/functions';
import LoadingIndicator from '../../../components/user/NewsFeed/LoadingIndicator';
import { useMutation, useQueryClient } from 'react-query';
import { Post } from '../../../../../shared';
import postService from '../../../utils/services/post.service';
import { geohashForLocation } from 'geofire-common';
import { auth } from '../../../../../firebaseConfig';
import { ScreenLayout } from '../../../components/user/Shared/ScreenLayout';
import { sendPushNotificationResponse } from '../../../utils/functions/notofications-handler';
import { deleteNotification } from '../../../utils/services/notifications-service';
import { generateUID } from '../../../utils/helper-functions/generateUID';

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

  const [selectedOccupancy, setSelectedOccupancy] = useState(
    OccupancyEnum.FULL
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [senderToken, setSenderToken] = useState<string | null>(null);
  const [notificationId, setNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (routeParams?.image && routeParams?.place) {
      setImage(routeParams.image);
      setPlace(routeParams.place);
      setSenderToken(routeParams.senderToken ?? null);
      setNotificationId(routeParams.notificationId ?? null);
    }
  }, [routeParams]);

  const occupancyLabels = {
    [OccupancyEnum.FULL]: t('full'),
    [OccupancyEnum.ALMOST_FULL]: t('almost-full'),
    [OccupancyEnum.SPARSELY_OCCUPIED]: t('sparsely-occupied'),
    [OccupancyEnum.EMPTY]: t('empty'),
  };

  const handleSelect = (option: OccupancyEnum) => {
    setSelectedOccupancy(option);
    setIsDropdownOpen(false);
  };

  const handleOutsideClick = () => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    }
  };

  const { mutate } = useMutation({
    mutationFn: (post: Omit<Post, 'creationTime'>) =>
      postService.savePost(post),
    onMutate: async newPost => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const previousPosts = queryClient.getQueryData<any>(['posts']);

      const newCachedPost: Omit<Post, 'creationTime'> = {
        ...newPost,
        id: 'temp-' + Date.now(),
        isLiked: false,
        commentsCount: 0,
        likesCount: 0,
        user: {
          id: auth.currentUser?.uid ?? '',
          displayName: auth.currentUser?.displayName ?? '',
          photoUrl: auth.currentUser?.photoURL ?? '',
          expoPushToken: '',
        },
      };

      queryClient.setQueryData(['posts'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any, index: number) =>
            index === 0
              ? { ...page, posts: [newCachedPost, ...page.posts] }
              : page
          ),
        };
      });

      return { previousPosts };
    },
    onError: (err, newPost, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
    },
    onSuccess: savedPost => {
      queryClient.setQueryData(['posts'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any, index: number) =>
            index === 0
              ? {
                  ...page,
                  posts: page.posts.map((p: Post) =>
                    p.id.startsWith('temp-') ? savedPost : p
                  ),
                }
              : page
          ),
        };
      });
    },
  });

  const handleSavePost = async () => {
    setIsSaving(true);

    if (image && place) {
      const url = await uploadImageAsync(image, place?.id);

      if (url) {
        const uid = generateUID();
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
          fileId: uid,
          occupancy: selectedOccupancy ?? '',
          folderId: place?.id ?? '',
          timestamp: Date.now(),
          placeName: place?.displayName.text ?? '',
          placeAddress: place?.formattedAddress ?? '',
          photoUrl: url,
        };

        try {
          await postService.savePost(newPost);
          mutate(newPost);
          navigation.navigate('Feed');
          if (senderToken)
            await sendPushNotificationResponse(senderToken, place.id);
          if (notificationId) await deleteNotification(notificationId);
          await setUser({ lastUploadedPost: new Date().toISOString() });
        } catch (e) {
          console.error(e);
          Alert.alert('Failed to save post');
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  return (
    <ScreenLayout clickFunction={navigation.goBack}>
      <TouchableWithoutFeedback onPress={handleOutsideClick}>
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

            <View style={[styles.textContainer, styles.dropdownContainer]}>
              <Text style={styles.label}>{t('occupancy')}:</Text>

              <View style={styles.dropdownWrapper}>
                <TouchableOpacity
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={[styles.dropdown, { width: 150 }]}
                >
                  <Text style={styles.dropdownText}>
                    {occupancyLabels[selectedOccupancy]}
                  </Text>
                </TouchableOpacity>

                {isDropdownOpen && (
                  <View style={styles.dropdownList}>
                    {Object.values(OccupancyEnum).map(option => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => handleSelect(option)}
                        style={styles.dropdownItem}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedOccupancy === option
                              ? { color: primaryColor }
                              : { color: 'white' },
                          ]}
                        >
                          {occupancyLabels[option]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={{ height: width, marginTop: 15 }}>
              <Image
                style={isTablet ? tabletStyles.photo : styles.photo}
                source={{
                  uri: image ?? '',
                }}
                priority={'high'}
                cachePolicy={'memory'}
                contentFit="cover"
              />
            </View>

            <TouchableOpacity
              style={formStyles.buttonPrimary}
              onPress={handleSavePost}
              disabled={isSaving}
            >
              {isSaving ? (
                <LoadingIndicator />
              ) : (
                <Text style={formStyles.buttonText}>{t('save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
  },
  textContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  label: {
    color: iconInactiveColor,
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
  dropdownContainer: {
    position: 'relative',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  dropdownWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 'auto',
    flex: 2,
  },
  dropdown: {
    padding: 10,
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: primaryBgColor,
    justifyContent: 'center',
  },
  dropdownText: {
    color: 'white',
    textAlign: 'right',
  },
  dropdownList: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: primaryBgColor,
    borderRadius: 10,
    borderColor: 'white',
    borderWidth: 1,
    zIndex: 30,
    width: '100%',
  },
  dropdownItem: {
    padding: 10,
    borderBottomColor: 'white',
    borderBottomWidth: 0.5,
  },
  dropdownItemText: {
    color: 'white',
    textAlign: 'right',
  },
});

const tabletStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
  },
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
