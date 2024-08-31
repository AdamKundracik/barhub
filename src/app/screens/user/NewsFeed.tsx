import Layout from '../../components/user/Layout';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ActionsRow from '../../components/user/ActionsRow';
import { useImageManagement } from '../../utils/hooks/useImageManagement';
import { useQuery, useQueryClient } from 'react-query';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { commonAppStyles } from '../../utils/styles/styles';
import PlaceSearch from '../../components/user/PlaceSearch';
import { PlaceDetailsResponse, PlacePrediction } from '../../utils/types/types';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlaceFilterChip from '../../components/user/PlaceFilterChip';
import { sendNotificationHandler } from '../../utils/helper-functions/sendNotificationHandler';
import { fetchPlaceDetails } from '../../utils/helper-functions/fetchPlaceDetail';
import {
  registerForPushNotificationsAsync,
  sendPushNotification,
} from '../../utils/services/notofications-handler';
import * as Notifications from 'expo-notifications';
import { setUser } from '../../utils/services/functions';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserContext } from '../../providers/UserProvider';
import { Post } from '../../../../shared';
import {
  handleFreshContent,
  handlePlacePosts,
} from '../../utils/helper-functions/posts-functions';
import UserPost from '../../components/user/UserPost';
import { getDaysSince } from '../../utils/helper-functions/getDaysSince';
import Ad from '../../components/user/Ad';

export const NewsFeed = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { userData } = useUserContext();
  const { deleteImage } = useImageManagement();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedPost, setZoomedPost] = useState<string | null>(null);
  const [place, setPlace] = useState<PlacePrediction | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [
    numberOfDaysSinceLastPostedPhoto,
    setNumberOfDaysSinceLastPostedPhoto,
  ] = useState(0);

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    const numberOfDays = getDaysSince(userData?.lastUploadedPost ?? new Date());
    setNumberOfDaysSinceLastPostedPhoto(numberOfDays);
  }, []);

  useEffect(() => {
    async function setTokenToDatabase(pushToken: string) {
      await setUser({ pushToken: pushToken });
    }

    registerForPushNotificationsAsync()
      .then((token: string | undefined) => {
        setExpoPushToken(token ?? '');
        setTokenToDatabase(token ?? '');
      })
      .catch((error: any) => setExpoPushToken(`${error}`));

    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        const placeId = response.notification.request.content.data.placeId;
        const senderToken =
          response.notification.request.content.data.senderToken;
        const notificationTTL =
          response.notification.request.content.data.notificationTTL;
        const sentAt = response.notification.request.content.data.sentAt;
        if (new Date().getTime() > sentAt + notificationTTL) {
          Alert.alert(t('request-expired'), t('missed-request-info'));
        } else {
          navigation.navigate('Camera', {
            placeId: placeId,
            senderToken: senderToken,
          });
        }
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const { data: imageUploading, refetch } = useQuery(
    'imageUploading',
    () => {},
    {
      refetchInterval: 5000,
    }
  );

  useEffect(() => {
    getFiles();
  }, [imageUploading]);

  async function requestPhoto() {
    const senderToken = userData?.pushToken;
    if (place) {
      const detail: PlaceDetailsResponse = await fetchPlaceDetails(
        place.placeId
      );
      const tokens = await sendNotificationHandler({
        latitude: detail.result.geometry.location.lat,
        longitude: detail.result.geometry.location.lng,
      });
      tokens.forEach(token => {
        sendPushNotification(token, place.placeId, senderToken ?? '');
      });
    }
  }

  const handleScreenFocus = () => {
    const image = queryClient.getQueryData<string>('capturedImage');
    if (image) deleteImage.mutate();
  };

  useFocusEffect(handleScreenFocus);

  async function savePlaceToStorage(place: PlacePrediction) {
    try {
      await AsyncStorage.setItem('savedPlace', JSON.stringify(place));
    } catch (error) {
      console.error('Error saving place to storage:', error);
    }
  }

  async function getPlaceFromStorage() {
    try {
      const savedPlace = await AsyncStorage.getItem('savedPlace');
      if (savedPlace) {
        setPlace(JSON.parse(savedPlace));
      }
    } catch (error) {
      console.error('Error getting place from storage:', error);
    }
  }

  const getFiles = async () => {
    setLoading(true);
    try {
      if (place) {
        const posts = await handlePlacePosts(place.placeId);
        setPosts(posts);
      } else {
        const posts = await handleFreshContent();
        setPosts(posts);
      }
    } catch (error) {
      console.error('Error getting files:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    getFiles();
  }, [place]);

  useEffect(() => {
    getPlaceFromStorage();
  }, []);

  useEffect(() => {
    getFiles();
    if (place) {
      savePlaceToStorage(place);
    }
  }, [place]);

  if (searching)
    return <PlaceSearch setSearching={setSearching} setPlace={setPlace} />;

  return (
    <Layout pageTitle="Feed">
      <View style={{ alignSelf: 'center', flexDirection: 'row' }}>
        <Text
          style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            paddingHorizontal: 5,
          }}
        >
          Bar
        </Text>
        <View
          style={{
            backgroundColor: '#ffa31a',
            borderRadius: 5,
          }}
        >
          <Text
            style={{
              color: 'black',
              fontSize: 24,
              fontWeight: 'bold',
              paddingHorizontal: 5,
            }}
          >
            hub
          </Text>
        </View>
      </View>
      <ActionsRow setSearching={setSearching} />
      {place && (
        <View style={{ alignSelf: 'flex-start', marginBottom: 5 }}>
          <PlaceFilterChip
            setPlace={setPlace}
            place={place.structuredFormat.mainText.text}
          />
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        <View style={{ alignSelf: 'center' }}>
          <Ad />
        </View>
        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : (
          <View>
            {imageUploading ? (
              <View>
                <Text style={commonAppStyles.textPrimary}>
                  Uploading photo...
                </Text>
              </View>
            ) : null}
            {posts.length ? (
              <>
                {place && (
                  <TouchableOpacity
                    style={styles.requestButton}
                    onPress={requestPhoto}
                  >
                    <Text
                      style={[
                        commonAppStyles.textSecondary,
                        { fontSize: 22, fontWeight: 'bold' },
                      ]}
                    >
                      {t('request-photo')}
                    </Text>
                  </TouchableOpacity>
                )}
                {posts.map(post => (
                  <View
                    key={post.photoUrl}
                    style={{
                      marginVertical: 10,
                      zIndex: zoomedPost === post.photoUrl ? 1 : 0,
                    }}
                  >
                    <UserPost
                      hasPremium={
                        (userData?.premium ||
                          numberOfDaysSinceLastPostedPhoto <= 2) ??
                        false
                      }
                      post={post}
                      setZoomedPost={setZoomedPost}
                      isZoomed={zoomedPost === post.photoUrl}
                    />
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.infoContainer}>
                <View style={{ marginBottom: 15, justifyContent: 'center' }}>
                  <Text style={[commonAppStyles.textPrimary, { fontSize: 22 }]}>
                    {t('photos-info')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={requestPhoto}
                >
                  <Text
                    style={[
                      commonAppStyles.textSecondary,
                      { fontSize: 22, fontWeight: 'bold' },
                    ]}
                  >
                    {t('request-photo')}
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: '#a6a6a6' }}>
                  {t('request-photo-info')}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  actionsRow: {
    height: 30,
    backgroundColor: 'white',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 10,
  },
  scrollView: {
    flexGrow: 1,
  },
  infoContainer: {
    marginTop: 50,
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    width: 300,
  },
  requestButton: {
    borderRadius: 10,
    backgroundColor: '#d8d8d8',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  text: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default NewsFeed;
