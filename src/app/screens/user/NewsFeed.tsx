import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import Layout from '../../components/user/Shared/Layout';
import { useQuery, useQueryClient } from 'react-query';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStackList } from '../../utils/types/screen-types';
import { useUserContext } from '../../providers/UserProvider';
import {
  handleFreshContent,
  handlePlacePosts,
} from '../../utils/helper-functions/posts-functions';
import { getDaysSince } from '../../utils/helper-functions/getDaysSince';
import PlaceSearch from '../../components/user/Search/PlaceSearch';
import { PlaceDetailsResponse, PlacePrediction } from '../../utils/types/types';
import { Post } from '../../../../shared';
import NotificationHandler from '../../components/user/NewsFeed/NotificationHandler';
import LoadingIndicator from '../../components/user/NewsFeed/LoadingIndicator';
import PostsList from '../../components/user/NewsFeed/PostList';
import EmptyState from '../../components/user/NewsFeed/EmptyState';
import { fetchPlaceDetails } from '../../utils/helper-functions/fetchPlaceDetail';
import { sendNotificationHandler } from '../../utils/helper-functions/sendNotificationHandler';
import { sendPushNotification } from '../../utils/services/notofications-handler';
import FeedHeader from '../../components/user/NewsFeed/FeedHeader';

export const NewsFeed: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { userData } = useUserContext();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedPost, setZoomedPost] = useState<string | null>(null);
  const [place, setPlace] = useState<PlacePrediction | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [isPlaceLoaded, setIsPlaceLoaded] = useState(false); // Ensure place is loaded before fetching files

  const [
    numberOfDaysSinceLastPostedPhoto,
    setNumberOfDaysSinceLastPostedPhoto,
  ] = useState(0);

  useEffect(() => {
    const numberOfDays = getDaysSince(userData?.lastUploadedPost ?? new Date());
    setNumberOfDaysSinceLastPostedPhoto(numberOfDays);
  }, [userData]);

  const { data: imageUploading, refetch } = useQuery(
    'imageUploading',
    () => {},
    { refetchInterval: 5000 }
  );

  // Fetch files only after place has been loaded
  useEffect(() => {
    if (isPlaceLoaded) {
      getFiles();
    }
  }, [imageUploading, isPlaceLoaded]);

  const getFiles = async () => {
    setLoading(true);
    try {
      if (place) {
        setPosts([]);
        const posts = await handlePlacePosts(place.placeId);
        setPosts(posts);
      } else {
        setPosts([]);
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
    if (isPlaceLoaded) {
      getFiles();
    }
  }, [place, isPlaceLoaded]);

  // Load place from storage once on component mount
  useEffect(() => {
    const loadPlaceFromStorage = async () => {
      try {
        const savedPlace = await AsyncStorage.getItem('savedPlace');
        if (savedPlace) {
          const parsedPlace = JSON.parse(savedPlace);
          setPlace(parsedPlace);
        }
      } catch (error) {
        console.error('Error loading place from storage:', error);
      } finally {
        setIsPlaceLoaded(true); // Indicate that the place has been loaded
      }
    };

    if (!isPlaceLoaded) {
      loadPlaceFromStorage();
    }
  }, [isPlaceLoaded]);

  useEffect(() => {
    getFiles();
  }, [place]);

  useEffect(() => {
    const savePlaceToStorage = async () => {
      try {
        await AsyncStorage.setItem('savedPlace', JSON.stringify(place));
      } catch (error) {
        console.error('Error saving place to storage:', error);
      }
    };

    if (place) {
      savePlaceToStorage();
    }
  }, [place]);

  async function requestPhoto() {
    const senderToken = userData?.pushToken;
    if (place) {
      const detail: PlaceDetailsResponse = await fetchPlaceDetails(
        place.placeId
      );
      const tokens = await sendNotificationHandler({
        latitude: detail.result.geometry.location?.lat,
        longitude: detail.result.geometry.location?.lng,
      });
      tokens.forEach(token => {
        sendPushNotification(token, place.placeId, senderToken ?? '');
      });
    }
  }

  if (searching)
    return <PlaceSearch setSearching={setSearching} setPlace={setPlace} />;

  return (
    <Layout pageTitle="Feed">
      <FeedHeader
        place={place}
        setSearching={setSearching}
        setPlace={setPlace}
      />
      <NotificationHandler navigation={navigation} userData={userData} />
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <LoadingIndicator />
        ) : posts.length ? (
          <PostsList
            posts={posts}
            zoomedPost={zoomedPost}
            setZoomedPost={setZoomedPost}
            userData={userData}
            numberOfDaysSinceLastPostedPhoto={numberOfDaysSinceLastPostedPhoto}
            place={place}
            requestPhoto={requestPhoto}
          />
        ) : (
          <EmptyState requestPhoto={requestPhoto} />
        )}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
  },
});

export default NewsFeed;
