import Layout from '../../components/user/Layout';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import UserPost from '../../components/user/UserPost';
import ActionsRow from '../../components/user/ActionsRow';
import { useImageManagement } from '../../utils/hooks/useImageManagement';
import { useQuery, useQueryClient } from 'react-query';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { commonAppStyles } from '../../utils/styles/styles';
import { listFiles } from '../../utils/helper-functions/helperFunctions';
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

export const NewsFeed = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { userData } = useUserContext();
  const { deleteImage } = useImageManagement();

  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedPost, setZoomedPost] = useState<string | null>(null);
  const [place, setPlace] = useState<PlacePrediction | null>(null);
  const [searching, setSearching] = useState<boolean>(false);

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

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
        navigation.navigate('Camera', {
          placeId: placeId,
          senderToken: senderToken,
        });
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
      const urls = await listFiles(place?.placeId);
      if (urls) {
        setFileUrls(urls);
      } else {
        setFileUrls([]);
      }
    } catch (error) {
      console.error('Error getting files:', error);
      setFileUrls([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
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
            {fileUrls.length ? (
              fileUrls.map(url => (
                <View
                  key={url}
                  style={{
                    marginVertical: 10,
                    zIndex: zoomedPost === url ? 1 : 0,
                  }}
                >
                  <UserPost
                    link={url}
                    setZoomedPost={setZoomedPost}
                    isZoomed={zoomedPost === url}
                  />
                </View>
              ))
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
    marginBottom: 15,
  },
});

export default NewsFeed;
